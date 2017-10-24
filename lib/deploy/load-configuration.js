const configuration = require("../configuration")
const AWS = require("../aws")

module.exports = {
  title: "Load configuration",
  task: (context) => {
    let configurationPath = context.configurationPath
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
