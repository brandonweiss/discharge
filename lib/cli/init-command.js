const logSymbols = require("log-symbols")
const configure = require("../configure")
const configuration = require("../configuration")

module.exports = async (configurationPath) => {
  let data = await configure()

	configuration.write(configurationPath, data)

	console.log(`\n${logSymbols.success}`, `Configuration written to \`${configurationPath}\`!`)
}
