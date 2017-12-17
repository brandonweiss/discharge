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
    let redirectAll = context.config.redirect_all

    let params = {
      DomainName: domain,
      IdempotencyToken: domain.replace(/\W/g, "_"),
    }
    if (!redirectAll) {
      params['SubjectAlternativeNames'] = [`*.${domain}`]
    }

    let certificate = await context.acm.requestCertificate(params)

    context.certificateARN = certificate.CertificateArn
  },
}
