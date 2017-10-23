const execa = require("execa")

module.exports = {
  title: "Build website",
  task: (context) => execa.shell(context.config.build_command),
}
