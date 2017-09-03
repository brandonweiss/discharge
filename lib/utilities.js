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
