module.exports.filter = (input) => {
  if (typeof(input) === "string" && input.match(/^\d+$/)) {
    return parseInt(input)
  } else {
    return input
  }
}

module.exports.validate = (input) => {
  if (Number.isInteger(input)) {
    return true
  } else {
    return "Must be a number."
  }
}

const oneMonthInSeconds = 2592000

module.exports.build = (cacheInSeconds, cacheControl, cdn) => {
  if (cacheControl) {
    return cacheControl
  }

  if (!Number.isInteger(cacheInSeconds)) {
    return null
  }

  if (cacheInSeconds === 0) {
    return "no-cache, no-store, must-revalidate"
  }

  let parts = [
    "public",
    `max-age=${cacheInSeconds}`,
  ]

  if (cdn) {
    parts.push(`s-maxage=${oneMonthInSeconds}`)
  }

  return parts.join(", ")
}
