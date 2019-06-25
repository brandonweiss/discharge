const childProcess = require("child_process")

module.exports = {
  title: "Build website",
  task: (context) => childProcess.execSync(context.config.build_command),
}
