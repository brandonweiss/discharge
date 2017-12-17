const RoutingRules = require("../routing-rules")

module.exports = {
  title: "Configure bucket as website",
  task: (context) => {
    let redirectAll = context.config.redirect_all
    let redirectDomain = context.config.redirect_domain
    let indexKey = context.config.index_key
    let errorKey = context.config.error_key

    /* We only need a simple configuration for redirecting */
    if (redirectAll) {
      return context.s3.putBucketWebsite({
        Bucket: context.config.domain,
        WebsiteConfiguration: {
          RedirectAllRequestsTo: {
            HostName: redirectDomain,
          },
        },
      })
    }

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
