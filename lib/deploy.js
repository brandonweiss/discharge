const Listr = require("listr")
const loadConfigurationTask = require("./deploy/load-configuration")
const buildWebsiteTask = require("./deploy/build-website")
const createBucketTask = require("./deploy/create-bucket")
const configureBucketAsWebsiteTask = require("./deploy/configure-bucket-as-website")
const synchronizeWebsiteTask = require("./deploy/synchronize-website")
const expireCacheTask = require("./deploy/expire-cache")

module.exports = new Listr([
  loadConfigurationTask,
  buildWebsiteTask,
  createBucketTask,
  configureBucketAsWebsiteTask,
  synchronizeWebsiteTask,
  expireCacheTask,
])
