const glob = require("glob")
const fs = require("fs")
const CacheControl = require("../cache-control")
const mime = require("mime")
const crypto = require("crypto")
const diff = require("../diff")

module.exports = {
  title: "Synchronize website",
  task: async (context, task) => {
    let domain = context.config.domain
    let uploadDirectory = context.config.upload_directory
    let trailingSlashes = context.config.trailing_slashes

    let targetKey = (path) => {
      if (path != "index.html" && path.endsWith("/index.html") && !trailingSlashes) {
        let directoryName = path.replace("/index.html", "")
        return directoryName
      } else {
        return path
      }
    }

    let paths = glob.sync("**/*", {
      cwd: uploadDirectory,
      nodir: true,
    })

    let cacheControl = CacheControl.build(context.config.cache, context.config.cache_control, context.config.cdn)

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

      await context.s3.putObject({
        Bucket: domain,
        Key: change.key,
      })
    }
  },
}
