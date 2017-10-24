const Listr = require("listr")
const loadConfigurationTask = require("./distribute/load-configuration")
const createCertificateTask = require("./distribute/create-certificate")
const verifyCertificateTask = require("./distribute/verify-certificate")
const createDistributionTask = require("./distribute/create-distribution")
const deployDistributionTask = require("./distribute/deploy-distribution")

module.exports = new Listr([
  loadConfigurationTask,
  createCertificateTask,
  verifyCertificateTask,
  createDistributionTask,
  deployDistributionTask,
])
