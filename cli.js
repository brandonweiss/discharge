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
    -f, --file  Specify an alternate config file (default: .discharge.json)
`, {
    alias: {
        f: 'file'
    },
    string: ['f'],
    default: {
        f: '.discharge.json'
    }
})

updateNotifier({ pkg: cli.pkg }).notify()

let command = cli.input[0]
let ConfigurationPath = cli.flags['file']

switch (command) {
case undefined:    return cli.showHelp()
case "init":       return initCommand(ConfigurationPath).catch(KnownError.catch)
case "deploy":     return deployCommand(ConfigurationPath).catch(KnownError.catch)
case "distribute": return distributeCommand(ConfigurationPath).catch(KnownError.catch)
}
