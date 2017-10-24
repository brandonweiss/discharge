const intersectionBy = require("lodash.intersectionby")
const differenceBy = require("lodash.differenceby")
const intersectionWith = require("lodash.intersectionwith")

module.exports = ({ source = [], target = [], locationProperty, contentsHashProperty }) => {
  let filesInBothSourceAndTarget = intersectionBy(source, target, locationProperty)
  let filesInSourceButNotTarget = differenceBy(source, target, locationProperty)
  let filesInTargetButNotSource = differenceBy(target, source, locationProperty)

  let filesInBothSourceAndTargetWithDifferentHashes = intersectionWith(source, target, (a, b) => {
    let locationsMatch = a[locationProperty] === b[locationProperty]
    let hashesDoNotMatch = a[contentsHashProperty] !== b[contentsHashProperty]

    return locationsMatch && hashesDoNotMatch
  })

  let filesInBothSourceAndTargetWithIdenticalHashes = differenceBy(filesInBothSourceAndTarget, filesInBothSourceAndTargetWithDifferentHashes, locationProperty)

  return {
    add: filesInSourceButNotTarget,
    remove: filesInTargetButNotSource,
    update: filesInBothSourceAndTargetWithDifferentHashes,
    ignore: filesInBothSourceAndTargetWithIdenticalHashes,
  }
}
