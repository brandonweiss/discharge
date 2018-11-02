#!/usr/bin/env node

const meow = require("meow")
const updateNotifier = require("update-notifier")
const KnownError = require("./lib/error")
const initCommand = require("./lib/cli/init-command")
const deployCommand = require("./lib/cli/deploy-command")
const distributeCommand = require("./lib/cli/distribute-command")

const cli = meow(`
  Usage
    $ discharge init
    $ discharge deploy
    $ discharge distribute
  
  Options
    --configPath, -c  The path and name of the discharge config to be created or used
`, {
  flags: {
    configPath: {
      type: 'string',
      alias: 'c',
      default: '.discharge.json',
    }
  }
})

updateNotifier({ pkg: cli.pkg }).notify()

const command = cli.input[0]
const configurationPath = cli.flags.configPath

switch (command) {
case undefined:    return cli.showHelp()
case "init":       return initCommand(configurationPath).catch(KnownError.catch)
case "deploy":     return deployCommand(configurationPath).catch(KnownError.catch)
case "distribute": return distributeCommand(configurationPath).catch(KnownError.catch)
}
