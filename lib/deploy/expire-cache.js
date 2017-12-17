const delay = require("../utilities").delay
const suppressConnectionErrors = require("../utilities").suppressConnectionErrors

const isInvalidationCompleted = async (context, distributionId, invalidationId) => {
  let data = await context.cloudFront.getInvalidation({
    DistributionId: distributionId,
    Id: invalidationId,
  })

  let status = data.Invalidation.Status

  return status === "Completed"
}

module.exports = {
  title: "Expire cache",
  enabled: (context) => context.config && context.config.cdn,
  skip: async (context) => {
    let domain = context.config.domain
    let redirectAll = context.config.redirect_all

    if (redirectAll) {
      return "Redirect enabled"
    }

    let data = await context.cloudFront.listDistributions({ MaxItems: "100" })
    let distributions = data.DistributionList.Items
    let distribution = distributions.find((distribution) => distribution.Aliases.Items.includes(domain))

    if (distribution) {
      context.distributionId = distribution.Id
      return false
    } else {
      return "Distribution not set up yet"
    }
  },
  task: async (context, task) => {
    let distributionId = context.distributionId
    let domain = context.config.domain
    let currentTime = new Date().toISOString()

    let data = await context.cloudFront.createInvalidation({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `${domain.replace(/\W/g, "_")}_${currentTime}`,
        Paths: {
          Items: ["/*"],
          Quantity: 1,
        },
      },
    })

    let invalidationId = data.Invalidation.Id

    let invalidationIsCompleted = false

    while (!invalidationIsCompleted) {
      await delay(5000)
      task.output = "This can take a few minutes"

      await suppressConnectionErrors(async () => {
        invalidationIsCompleted = await isInvalidationCompleted(context, distributionId, invalidationId)
      })
    }
  },
}
