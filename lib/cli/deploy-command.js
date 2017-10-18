const deploy = require("../deploy")
const AWS = require("../aws")
const logSymbols = require("log-symbols")
const configuration = require("../configuration")

module.exports = async (configurationPath) => {
  let context = await  deploy.run({
    configurationPath: configurationPath,
    config: {},
  })

  let dnsNotConfigured = !context.config.dns_configured
  let domain = context.config.domain
  let cloudFrontInProgress = context.config.cloudfront && !context.config.cloudfront_ready
  let url = `http://${domain}`
  let endpoint = AWS.findEndpointByRegionKey(context.config.aws_region)
  let cname = `${domain}.${endpoint}`

  if (context.update_config.length > 0) {
    let toUpdate = Object.assign(...context.update_config.map(key => ({ [key]: context.config[key] })))
    configuration.update(configurationPath, toUpdate)
  }

  if (cloudFrontInProgress) {
    url = `${url}.${endpoint}`
    cname = context.config.cloudfront_url
  }
  if (dnsNotConfigured) {
    if (context.config.cloudfront && context.config.cloudfront_ready) {
      cname = context.config.cloudfront_url
      url = `http://${context.config.cloudfront_url}`
    } else if (!cloudFrontInProgress) {
      url = `${url}.${endpoint}`
    }
  }

  console.log(`\n${logSymbols.success}`, `Website deployed! You can see it at ${url}`)

  if (dnsNotConfigured) {
    console.log(`\n${logSymbols.info}`, `Make sure you configure your DNS—add an ALIAS or CNAME from \`${domain}\` to \`${cname}\``)
    console.log(`${logSymbols.info}`, "This reminder won’t show again.")

    configuration.update(configurationPath, { dns_configured: true })
  }
}
