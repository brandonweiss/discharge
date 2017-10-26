module.exports.intersperse = (array, separator) => {
  return array.reduce((newArray, item, index) => {
    newArray.push(item)

    if (index !== array.length - 1) {
      newArray.push(separator)
    }

    return newArray
  }, [])
}

module.exports.flatten = (arrayOfArrays) => {
  return [].concat(...arrayOfArrays)
}

module.exports.delay = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

module.exports.suppressConnectionErrors = (callback) => {
  try {
    return callback()
  } catch(error) {
    if (error.message.startsWith("connect")) {
      throw(error)
    }
  }
}
