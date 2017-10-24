#!/usr/bin/env node

const meow = require("meow")
const updateNotifier = require("update-notifier")
const KnownError = require("./lib/error")
const initCommand = require("./lib/cli/init-command")
const deployCommand = require("./lib/cli/deploy-command")
const ConfigurationPath = ".discharge.json"

const cli = meow(`
  Usage
    $ discharge init
    $ discharge deploy
`)

updateNotifier({ pkg: cli.pkg }).notify()

let command = cli.input[0]

switch (command) {
case undefined: return cli.showHelp()
case "init":    return initCommand(ConfigurationPath).catch(KnownError.catch)
case "deploy":  return deployCommand(ConfigurationPath).catch(KnownError.catch)
}
