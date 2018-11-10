const URL = require("url")

const removeRootForwardSlash = (path) => {
  return path.replace(/^\//, "")
}

module.exports = (redirects, routingRules) => {
  if (routingRules) {
    return routingRules
  }

  return redirects.map((redirect) => {
    let redirectOptions = {
      HttpRedirectCode: "301",
    }

    let url = URL.parse(redirect.destination)

    if (url.protocol && url.hostname) {
      redirectOptions.Protocol = url.protocol.replace(":", "")
      redirectOptions.HostName = url.hostname
    }

    redirectOptions.ReplaceKeyWith = removeRootForwardSlash(url.path)

    return {
      Condition: {
        KeyPrefixEquals: removeRootForwardSlash(redirect.prefix_match),
      },
      Redirect: redirectOptions,
    }
  })
}
