const glob = require("glob")
const fs = require("fs")
const CacheControl = require("../cache-control")
const mime = require("mime")
const crypto = require("crypto")
const diff = require("../diff")
const flatMap = require("lodash.flatmap")

module.exports = {
  title: "Synchronize website",
  task: async (context, task) => {
    let domain = context.config.domain
    let uploadDirectory = context.config.upload_directory

    let paths = glob.sync("**/*", {
      cwd: uploadDirectory,
      nodir: true,
    })

    let cacheControl = CacheControl.build(
      context.config.cache,
      context.config.cache_control,
      context.config.cdn,
    )

    let source = flatMap(paths, (path) => {
      let fullPath = `${uploadDirectory}/${path}`
      let content = fs.readFileSync(fullPath)
      let md5Hash = `"${crypto
        .createHash("md5")
        .update(content)
        .digest("hex")}"`

      let files = [
        {
          path: path,
          key: path,
          md5Hash: md5Hash,
        },
      ]

      if (path.endsWith(".html")) {
        files.push({
          path: path,
          key: path.replace(/\.html$/, ""),
          md5Hash: md5Hash,
        })
      }

      return files
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
    }

    for (let change of changes.remove) {
      task.output = `Removing ${change.key}`

      await context.s3.deleteObject({
        Bucket: domain,
        Key: change.key,
      })
    }
  },
}
