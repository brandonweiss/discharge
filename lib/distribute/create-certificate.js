module.exports = {
  title: "Create certificate",
  skip: async (context) => {
    let domain = context.config.domain

    let data = await context.acm.listCertificates({ MaxItems: 100 })
    let certificates = data.CertificateSummaryList
    let certificate = certificates.find((certificate) => certificate.DomainName === domain)

    if (certificate) {
      context.certificateARN = certificate.CertificateArn
      return "Certificate already exists"
    } else {
      return false
    }
  },
  task: async (context) => {
    let domain = context.config.domain

    let certificate = await context.acm.requestCertificate({
      DomainName: domain,
      IdempotencyToken: domain.replace(/\W/g, "_"),
      SubjectAlternativeNames: [`*.${domain}`],
    })

    context.certificateARN = certificate.CertificateArn
  },
}
