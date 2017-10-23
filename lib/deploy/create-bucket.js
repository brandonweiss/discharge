module.exports = {
  title: "Create bucket",
  skip: async (context) => {
    let bucketExists = false

    try {
      bucketExists = await context.s3.headBucket({ Bucket: context.config.domain })
    } catch(error) {}

    if (bucketExists) {
      return "Bucket already exists"
    } else {
      return false
    }
  },
  task: (context) => {
    return context.s3.createBucket({
      ACL: "public-read",
      Bucket: context.config.domain,
    })
  },
}
