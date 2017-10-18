const KnownError = require("./error").error
const AWS = require("./aws")
const execa = require("execa")
const Listr = require("listr")
const glob = require("glob")
const fs = require("fs")
const configuration = require("./configuration")
const RoutingRules = require("./routing-rules")
const CacheControl = require("./cache-control")
const mime = require("mime")
const crypto = require("crypto")
const diff = require("./diff")

let loadConfigurationTask = {
  title: "Load configuration",
  task: (context) => {
    let configurationPath = context.configurationPath

    if (!configuration.exists(configurationPath)) {
      throw new KnownError("No configuration file, run `discharge init` first")
    }

    let config = configuration.read(configurationPath)
    let credentials = AWS.credentialsForProfile(config.aws_profile)
    let region = config.aws_region

    context.s3 = AWS.s3({
      credentials: credentials,
      region: region,
    })
    context.config = config
    context.update_config = []

    if (context.config.cloudfront) {
      context.cloudFront = AWS.cloudFront({
        credentials: credentials,
        region: region,
      })
    }
  },
}

let buildWebsiteTask = {
  title: "Build website",
  task: (context) => execa.shell(context.config.build_command),
}

let createBucketTask = {
  title: "Create bucket",
  skip: async (context) => {
    let bucketExists = false

    try {
      bucketExists = await context.s3.headBucket({ Bucket: context.config.domain })
    } catch(error) {}

    if (bucketExists) {
      return "Bucket already exists"
    } else {
      return false
    }
  },
  task: (context) => {
    return context.s3.createBucket({
      ACL: "public-read",
      Bucket: context.config.domain,
    })
  },
}

let configureBucketAsWebsiteTask = {
  title: "Configure bucket as website",
  task: (context) => {
    let indexKey = context.config.index_key
    let errorKey = context.config.error_key

    if (!context.config.trailing_slashes) {
      errorKey = errorKey.replace(".html", "")
    }

    let params = {
      Bucket: context.config.domain,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: errorKey,
        },
        IndexDocument: {
          Suffix: indexKey,
        },
      },
    }

    if (context.config.redirects || context.config.routing_rules) {
      let routingRules = RoutingRules(context.config.redirects, context.config.routing_rules)
      params.WebsiteConfiguration.RoutingRules = routingRules
    }

    return context.s3.putBucketWebsite(params)
  },
}

let synchronizeWebsiteTask = {
  title: "Synchronize website",
  task: async (context, task) => {
    let domain = context.config.domain
    let uploadDirectory = context.config.upload_directory
    let trailingSlashes = context.config.trailing_slashes

    let targetKey = (path) => {
      if (path != "index.html" && path.endsWith("/index.html") && !trailingSlashes) {
        let directoryName = path.split("/")[0]
        return directoryName
      } else {
        return path
      }
    }

    let paths = glob.sync("**/*", {
      cwd: uploadDirectory,
      nodir: true,
    })

    let cacheControl = CacheControl.build(context.config.cache, context.config.cache_control)

    let source = paths.map((path) => {
      let fullPath = `${uploadDirectory}/${path}`
      let content = fs.readFileSync(fullPath)
      let md5Hash = `"${crypto.createHash("md5").update(content).digest("hex")}"`

      return {
        path: path,
        key: targetKey(path),
        md5Hash: md5Hash,
      }
    })

    let response = await context.s3.listObjectsV2({ Bucket: domain })
    let target = response.Contents.map((object) => {
      return {
        key: object.Key,
        md5Hash: object.ETag,
      }
    })

    let changes = diff({
      source: source,
      target: target,
      locationProperty: "key",
      contentsHashProperty: "md5Hash",
    })
    context.changedKeys = []

    for (let change of changes.add) {
      task.output = `Adding ${change.path} as ${change.key}`
      let fullPath = `${uploadDirectory}/${change.path}`

      await context.s3.putObject({
        Bucket: domain,
        Body: fs.readFileSync(fullPath),
        Key: change.key,
        ACL: "public-read",
        CacheControl: cacheControl,
        ContentType: mime.getType(fullPath),
      })
      context.changedKeys.push(change.key)
    }

    for (let change of changes.update) {
      task.output = `Updating ${change.path} as ${change.key}`
      let fullPath = `${uploadDirectory}/${change.path}`

      await context.s3.putObject({
        Bucket: domain,
        Body: fs.readFileSync(fullPath),
        Key: change.key,
        ACL: "public-read",
        CacheControl: cacheControl,
        ContentType: mime.getType(fullPath),
      })
      context.changedKeys.push(change.key)
    }

    for (let change of changes.remove) {
      task.output = `Removing ${change.key}`

      await context.s3.putObject({
        Bucket: domain,
        Key: change.key,
      })
      context.changedKeys.push(change.key)
    }
  },
}

let createCloudfrontTask = {
  title: "Creating CloudFront Distribution",
  enabled: context => context.config.cloudfront,
  skip: async (context) => {
    let distribution = null
    if (!context.config.cloudfront_distribution) {
      let listDistributions = async (marker) => {
        let response = await context.cloudFront.listDistributions({ Marker: marker, MaxItems: "50" })
        return {
          newMarker: response.DistributionList.NextMarker,
          distributions: response.DistributionList.Items,
        }
      }
      let hasMore = true
      let marker = ""
      let domain = context.config.domain.toLowerCase()
      while (hasMore && !distribution) {
        let { newMarker, distributions } = await listDistributions(marker)
        distribution = distributions.find((d) => {
          return d.DomainName === domain || d.Aliases.Items.includes(domain)
        })
        if (!newMarker) {
          hasMore = false
        }
        marker = newMarker
      }
      if (distribution) {
        context.config.cloudfront_distribution = distribution.Id
        context.config.cloudfront_url = distribution.DomainName
        context.update_config.push("cloudfront_distribution")
        context.update_config.push("cloudfront_url")
      }
    } else {
      distribution = await context.cloudFront.getDistribution({ Id: context.config.cloudfront_distribution })
    }

    if (!distribution) {
      return false
    } else {
      let state = distribution.Status
      context.config.cloudfront_ready = state === "Deployed"
      context.update_config.push("cloudfront_ready")
      return `Distribution ${context.config.cloudfront_distribution} (${context.config.cloudfront_url}) is in ${state} state`
    }
  },
  task: async (context, task) => {
    let domain = context.config.domain
    let defaultOrigin = `S3-${domain}`
    task.output = "Creating distribution"
    try {
      let distribution = await context.cloudFront.createDistribution({
        DistributionConfig: {
          CallerReference: `discharge-${domain}`,
          Aliases: {
            Quantity: 1,
            Items: [domain],
          },
          DefaultRootObject: context.config.index_key,
          Origins: {
            Quantity: 1,
            Items: [
              {
                Id: defaultOrigin,
                DomainName: `${domain}.s3.amazonaws.com`,
                OriginPath: "",
                S3OriginConfig: {
                  OriginAccessIdentity: "",
                },
              },
            ],
          },
          DefaultCacheBehavior: {
            TargetOriginId: defaultOrigin,
            ForwardedValues: {
              QueryString: false,
              Cookies: {
                Forward: "none",
              },
              Headers: {
                Quantity: 0,
                Items: [],
              },
              QueryStringCacheKeys: {
                Quantity: 0,
                Items: [],
              },
            },
            TrustedSigners: {
              Enabled: false,
              Quantity: 0,
              Items: [],
            },
            ViewerProtocolPolicy: context.config.cloudfront_https,
            MinTTL: 0,
            MaxTTL: context.config.cache,
            AllowedMethods: {
              Quantity: 2,
              Items: ["GET", "HEAD"],
            },
            Compress: context.config.cloudfront_compress,
          },
          CustomErrorResponses: {
            Quantity: 1,
            Items: [
              {
                ErrorCode: 404,
                ResponseCode: "404",
                ResponsePagePath: `/${context.config.error_key}`,
              },
            ],
          },
          Comment: "Managed by discharge",
          Enabled: true,
        },
      })
      context.config.cloudfront_distribution = distribution.Id
      context.config.cloudfront_url = distribution.DomainName
      context.config.cloudfront_ready = distribution.Status === "Deployed"
      context.update_config = context.update_config.concat([
        "cloudfront_distribution",
        "cloudfront_url",
        "cloudfront_ready",
      ])
    } catch (err) {
      console.log(err)
      return false
    }
  },
}

let invalidateCloudfrontTask = {
  title: "Invalidating CloudFront objects",
  enabled: context => context.config.cloudfront,
  skip: context => !context.config.cloudfront_ready && context.changedKeys.length === 0,
  task: async (context, task) => {
    task.output = `Invalidating ${context.changedKeys.length} keys`
    return await context.cloudFront.createInvalidation({
      DistributionId: context.config.cloudfront_distribution,
      InvalidationBatch: {
        CallerReference: `${new Date().getTime()}`,
        Paths: {
          Quantity: context.changedKeys.length,
          Items: context.changedKeys.map(k => `/${k}`),
        },
      },
    })
  },
}

const tasks = new Listr([
  loadConfigurationTask,
  buildWebsiteTask,
  createBucketTask,
  configureBucketAsWebsiteTask,
  synchronizeWebsiteTask,
  createCloudfrontTask,
  invalidateCloudfrontTask,
])

module.exports = tasks
