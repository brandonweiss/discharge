const delay = require("../utilities").delay
const suppressConnectionErrors = require("../utilities").suppressConnectionErrors

const findDistributionByDomain = async (context, domain) => {
  let data = await context.cloudFront.listDistributions({ MaxItems: "100" })
  let distributions = data.DistributionList.Items
  return distributions.find((distribution) => distribution.Aliases.Items.includes(domain))
}

const findDistributionById = async (context, id) => {
  let data = await context.cloudFront.getDistribution({ Id: id })
  return data.Distribution
}

const isDistributionDeployed = (distribution) => distribution.Status === "Deployed"

module.exports = {
  title: "Deploy distribution",
  task: async (context, task) => {
    let domain = context.config.domain

    let distribution = await findDistributionByDomain(context, domain)
    context.cdnDomain = distribution.DomainName
    if (isDistributionDeployed(distribution)) { return }

    let distributionIsDeployed = false

    while (!distributionIsDeployed) {
      await delay(5000)
      task.output = "This can take a while (~5–15 minutes)"

      await suppressConnectionErrors(async () => {
        distribution = await findDistributionById(context, distribution.Id)
        distributionIsDeployed = isDistributionDeployed(distribution)
      })
    }
  },
}
