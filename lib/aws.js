const AWS = require("aws-sdk")

const regions = [
  { name: "US East (N. Virginia)",     key: "us-east-1",      endpoint: "s3-website-us-east-1.amazonaws.com" },
  { name: "US East (Ohio)",            key: "us-east-2",      endpoint: "s3-website.us-east-2.amazonaws.com" },
  { name: "US West (N. California)",   key: "us-west-1",      endpoint: "s3-website-us-west-1.amazonaws.com" },
  { name: "US West (Oregon)",          key: "us-west-2",      endpoint: "s3-website-us-west-2.amazonaws.com" },
  { name: "Canada (Central)",          key: "ca-central-1",   endpoint: "s3-website.ca-central-1.amazonaws.com" },
  { name: "Asia Pacific (Mumbai)",     key: "ap-south-1",     endpoint: "s3-website.ap-south-1.amazonaws.com" },
  { name: "Asia Pacific (Tokyo)",      key: "ap-northeast-1", endpoint: "s3-website-ap-northeast-1.amazonaws.com" },
  { name: "Asia Pacific (Seoul)",      key: "ap-northeast-2", endpoint: "s3-website.ap-northeast-2.amazonaws.com" },
  { name: "Asia Pacific (Singapore)",  key: "ap-southeast-1", endpoint: "s3-website-ap-southeast-1.amazonaws.com" },
  { name: "Asia Pacific (Sydney)",     key: "ap-southeast-2", endpoint: "s3-website-ap-southeast-2.amazonaws.com" },
  { name: "EU (Frankfurt)",            key: "eu-central-1",   endpoint: "s3-website.eu-central-1.amazonaws.com" },
  { name: "EU (Ireland)",              key: "eu-west-1",      endpoint: "s3-website-eu-west-1.amazonaws.com" },
  { name: "EU (London)	",             key: "eu-west-2",      endpoint: "s3-website.eu-west-2.amazonaws.com" },
  { name: "South America (São Paulo)", key: "sa-east-1",      endpoint: "s3-website-sa-east-1.amazonaws.com" },
]

module.exports.findEndpointByRegionKey = (regionKey) => {
  return regions.find((region) => {
  return region.key === regionKey
  }).endpoint
}

module.exports.regionsGroupedByPrefix = () => {
  return regions.reduce((object, region) => {
    let regionKeyPrefix = region.key.split("-")[0]
    object[regionKeyPrefix] = object[regionKeyPrefix] || []

    object[regionKeyPrefix].push({ name: region.name, key: region.key })

    return object
  }, [])
}

module.exports.credentialsForProfile = (profileKey) => {
  return new AWS.SharedIniFileCredentials({ profile: profileKey })
}

// Wraps an AWS endpoint instance so that you don’t always have to chain `.promise()` onto every function
const iPromiseYou = (object) => {
  return new Proxy(object, {
    get(target, propertyKey, _receiver) {
      let property = target[propertyKey]

      if (typeof(property) === "function") {
        return function(...args) {
          let result = property.apply(this, args)

          if (result instanceof AWS.Request) {
            return result.promise()
          } else {
            return result
          }
        }
      } else {
        return property
      }
    },
  })
}

module.exports.s3 = (options) => {
  let s3 = new AWS.S3(options)
  return iPromiseYou(s3)
}

module.exports.cloudFront = (options) => {
  let cloudfront = new AWS.CloudFront(options)
  return iPromiseYou(cloudfront)
}