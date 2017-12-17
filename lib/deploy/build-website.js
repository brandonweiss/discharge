const execa = require("execa")

module.exports = {
  title: "Build website",
  skip: context => context.config.redirect_all,
  task: (context) => execa.shell(context.config.build_command),
}
