const fs = require("fs")
const KnownError = require("./error").error

const read = (configurationPath) => {
  if (!fs.existsSync(configurationPath)) {
    throw new KnownError("No configuration file, run `discharge init` first")
  }

  let file = fs.readFileSync(configurationPath)

  try {
    return JSON.parse(file)
  } catch (error) {
    throw new KnownError("Configuration file cannot be parsed—ensure the JSON is valid")
  }
}

module.exports.read = read

const write = (configurationPath, configuration) => {
  let json = JSON.stringify(configuration, null, 2)
  return fs.writeFileSync(configurationPath, `${json}\n`)
}

module.exports.write = write

module.exports.update = (configurationPath, updatedConfiguration) => {
  let configuration = read(configurationPath)
  configuration = Object.assign(configuration, updatedConfiguration)

  return write(configurationPath, configuration)
}
