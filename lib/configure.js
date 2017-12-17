const AWS = require("./aws")
const inquirer = require("inquirer")
const intersperse = require("./utilities").intersperse
const flatten = require("./utilities").flatten
const CacheControl = require("./cache-control")

let choices = Object.values(AWS.regionsGroupedByPrefix()).map((regionGroup) => {
  return regionGroup.map((region) => {
    return { name: region.name, value: region.key }
  })
})

let choicesWithSeparators = flatten(intersperse(choices, new inquirer.Separator()))

let redirectsPrompt = async (array) => {
  let answers = await inquirer.prompt([
    {
      name: "prefix_match",
      message: "Prefix to match on?",
      type: "input",
    }, {
      name: "destination",
      message: "Destination to redirect to?",
      type: "input",
    }, {
      name: "again",
      message: "Do you want to setup another redirect?",
      default: true,
      type: "confirm",
    },
  ])

  array.push({ prefix_match: answers.prefix_match, destination: answers.destination })

  if (answers.again) {
    return redirectsPrompt(array)
  } else {
    return array
  }
}

module.exports = async () => {
  let configuration = {}
  let answers

  answers = await inquirer.prompt([
    {
      name: "domain",
      message: "Domain name:",
      default: "example.com",
      type: "input",
    },
    {
      name: "redirect_all",
      message: "Redirect to another domain",
      type: "confirm",
      default: false,
    },
    {
      name: "redirect_domain",
      message: "Redirect domain name:",
      type: "input",
      when: answers => answers.redirect_all,
    }, {
      name: "build_command",
      message: "Build command",
      default: "npm run build",
      type: "input",
      when: answers => !answers.redirect_all,
    }, {
      name: "upload_directory",
      message: "Directory to upload",
      default: "build",
      type: "input",
      when: answers => !answers.redirect_all,
    }, {
      name: "index_key",
      message: "Index key",
      default: "index.html",
      type: "input",
      when: answers => !answers.redirect_all,
    }, {
      name: "error_key",
      message: "Error key",
      default: "404.html",
      type: "input",
      when: answers => !answers.redirect_all,
    }, {
      name: "trailing_slashes",
      message: "URLs should have trailing slashes?",
      default: true,
      type: "confirm",
      when: answers => !answers.redirect_all,
    }, {
      name: "cache",
      message: "Number of seconds to cache pages for?",
      default: 3600,
      type: "input",
      filter: CacheControl.filter,
      validate: CacheControl.validate,
      when: answers => !answers.redirect_all,
    }, {
      name: "redirects",
      message: "Do you want to setup redirects?",
      default: false,
      type: "confirm",
      when: answers => !answers.redirect_all,
    },
  ])

  configuration = Object.assign(configuration, answers)

  if (configuration.redirects) {
    configuration.redirects = await redirectsPrompt([])
  } else {
    delete(configuration.redirects)
  }

  answers = await inquirer.prompt([
    {
      name: "aws_profile",
      message: "AWS credentials profile",
      default: "default",
      type: "input",
    }, {
      name: "aws_region",
      message: "AWS region",
      type: "list",
      choices: choicesWithSeparators,
      pageSize: choicesWithSeparators.length,
    }, {
      name: "cdn",
      message: "Use a CDN for performance and HTTPS/TLS for security?",
      default: true,
      type: "confirm",
    }, {
      name: "dns_configured",
      message: "Is your DNS configured?",
      default: false,
      type: "confirm",
    },
  ])

  configuration = Object.assign(configuration, answers)

  return configuration
}
