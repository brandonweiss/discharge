const configuration = require("../configuration")
const AWS = require("../aws")

module.exports = {
  title: "Load configuration",
  task: (context) => {
    let configurationPath = context.configurationPath
    let config = configuration.read(configurationPath)
    let credentials = AWS.credentialsForProfile(config.aws_profile)

    context.acm = AWS.acm({
      credentials: credentials,
      region: "us-east-1",
    })

    context.cloudFront = AWS.cloudFront({
      credentials: credentials,
    })

    context.config = config
  },
}
