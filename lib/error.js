class KnownError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, KnownError)
  }
}

module.exports.error = KnownError

module.exports.catch = (error) => {
  let errorIsKnown = error instanceof KnownError
  if (!errorIsKnown) { throw error }
}
