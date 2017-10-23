const RoutingRules = require("../routing-rules")

module.exports = {
  title: "Configure bucket as website",
  task: (context) => {
    let indexKey = context.config.index_key
    let errorKey = context.config.error_key

    if (!context.config.trailing_slashes) {
      errorKey = errorKey.replace(".html", "")
    }

    let params = {
      Bucket: context.config.domain,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: errorKey,
        },
        IndexDocument: {
          Suffix: indexKey,
        },
      },
    }

    if (context.config.redirects || context.config.routing_rules) {
      let routingRules = RoutingRules(context.config.redirects, context.config.routing_rules)
      params.WebsiteConfiguration.RoutingRules = routingRules
    }

    return context.s3.putBucketWebsite(params)
  },
}
