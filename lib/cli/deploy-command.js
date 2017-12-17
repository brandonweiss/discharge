const deploy = require("../deploy")
const AWS = require("../aws")
const logSymbols = require("log-symbols")
const configuration = require("../configuration")

module.exports = async (configurationPath) => {
  let context = await deploy.run({
    configurationPath: configurationPath,
  })

  let dnsNotConfigured = !context.config.dns_configured
  let domain = context.config.domain
  let url = `http://${domain}`
  let endpoint = AWS.findEndpointByRegionKey(context.config.aws_region)

  if (dnsNotConfigured) {
    url = `${url}.${endpoint}`
  }

  console.log(`\n${logSymbols.success}`, `Website deployed! You can see it at ${url}`)

  if (dnsNotConfigured) {
    if (!context.config.cdn) {
      console.log(`\n${logSymbols.info}`, `Make sure you configure your DNS—add an ALIAS or CNAME from your domain to \`${domain}.${endpoint}\``)
      console.log(`${logSymbols.info}`, "This reminder won’t show again.")

      configuration.update(configurationPath, { dns_configured: true })
    } else {
      console.log(`\n${logSymbols.info}`, "Run `discharge distribute` to configure the CDN")
    }
  }
}
