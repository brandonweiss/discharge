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

module.exports.build = (cacheInSeconds, cacheControl) => {
  if (cacheControl) {
    return cacheControl
  }

  if (!Number.isInteger(cacheInSeconds)) {
    return null
  }

  if (cacheInSeconds === 0) {
    return "no-cache, no-store, must-revalidate"
  } else {
    return `public, max-age=${cacheInSeconds}`
  }
}
