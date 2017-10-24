const distribute = require("../distribute")
const logSymbols = require("log-symbols")
const configuration = require("../configuration")

module.exports = async (configurationPath) => {
  let context = await distribute.run({
    configurationPath: configurationPath,
  })

  let dnsNotConfigured = !context.config.dns_configured
  let cdnNotEnabled = !context.config.cdn
  let cdnDomain = context.cdnDomain
  let domain = context.config.domain
  let url = `https://${dnsNotConfigured ? cdnDomain : domain}`

  console.log(`\n${logSymbols.success}`, `Distribution deployed! You can see it at ${url}`)

  if (dnsNotConfigured || cdnNotEnabled) {
    console.log(`\n${logSymbols.info}`, `Make sure you configure your DNS—add an ALIAS or CNAME from \`${domain}\` to \`${cdnDomain}\``)
    console.log(`${logSymbols.info}`, "This reminder won’t show again.")

    configuration.update(configurationPath, {
      cdn: true,
      dns_configured: true,
    })
  }
}
