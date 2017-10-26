const delay = require("../utilities").delay
const suppressConnectionErrors = require("../utilities").suppressConnectionErrors

const isCertificateVerified = async (context, certificateARN) => {
  let data = await context.acm.describeCertificate({ CertificateArn: certificateARN })
  let status = data.Certificate.Status

  return status === "ISSUED"
}

module.exports = {
  title: "Verify certificate",
  task: async (context, task) => {
    let certificateARN = context.certificateARN

    if (await isCertificateVerified(context, certificateARN)) { return }

    let certificateIsVerified = false

    while (!certificateIsVerified) {
      task.output = "A verification email has been sent to an email address associated with your domain"
      await delay(5000)

      await suppressConnectionErrors(async () => {
        certificateIsVerified = await isCertificateVerified(context, certificateARN)
      })
    }
  },
}
