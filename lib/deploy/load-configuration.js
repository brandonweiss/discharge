const configuration = require("../configuration")
const KnownError = require("../error").error
const AWS = require("../aws")

module.exports = {
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
  },
}
