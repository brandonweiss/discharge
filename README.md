<h1 align="center">
	<br>
	<img src="assets/logo.svg?sanitize=true" alt="Discharge">
	<br>
	<br>
</h1>

> A simple, easy way to deploy static websites to Amazon S3

[![](https://badgen.net/travis/brandonweiss/discharge?icon=travis)](https://www.travis-ci.com/brandonweiss/discharge)
[![](https://badgen.net/npm/v/@static/discharge?icon=npm)](https://www.npmjs.com/package/@static/discharge)
![](https://badgen.net/npm/node/@static/discharge)
[![](https://badgen.net/david/dep/brandonweiss/discharge)](https://david-dm.org/brandonweiss/discharge)
![](https://badgen.net/badge/documentation/lit/purple)
[![](https://badgen.net/badge//AWESOME?icon=awesome&color=494368)](https://github.com/sindresorhus/awesome-nodejs#command-line-apps)

![screenshot](assets/screenshot.gif)

## Features

* Very little understanding of AWS required
* Interactive UI for configuring deployment
* Step-by-step list of what’s happening
* Support for no trailing slashes in URLs
* Support for subdomains
* Use an AWS Profile (named credentials) to authenticate with AWS
* CDN (CloudFront) and HTTPS/TLS support

## Installation

Install it globally:

```
$ npm install --global @static/discharge
```

Or add it to your application’s `package.json`:

```
$ npm install --save-dev @static/discharge
```

## Usage

### Authentication

#### Credentials in file

[Configuring AWS credentials][aws-credentials-file] can be a bit confusing. After getting your Access Key ID and Secret Access Key from AWS, you should store them in a file at `~/.aws/credentials`. It should look something like this:


```
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Replace the example keys with your own.

#### Credentials in environment

Alternatively, if you prefer environment variables or you are running Discharge in an automated environment like a continuous integration/deployment server you can omit the `aws_profile` configuration option explained later and set environment variables instead.

```
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Replace the example keys with your own.

### Configure

Configuration is done via a `.discharge.json` file located at the root of your application. You can run `discharge init` to get an interactive UI that will help you generate the configuration file, or you can write it yourself from scratch. It will look something like this:

```json
{
  "domain": "anti-pattern.com",
  "build_command": "bundle exec middleman build",
  "upload_directory": "build",
  "index_key": "index.html",
  "error_key": "404.html",
  "trailing_slashes": false,
  "cache": 3600,
  "aws_profile": "website-deployment",
  "aws_region": "us-west-1",
  "cdn": true,
  "dns_configured": false,
  "should_keep_files_in_s3": true,
}
```

Those are most of the configuration options but a complete list is next.

#### Configuration options

There are no defaults—all configuration options are explicit and must be provided unless marked as optional.

**domain** `String`

The domain name of your website. This will be used as the name of the S3 bucket your website will be uploaded to.

**build_command** `String`

The command that will be executed in the shell to build your static website.

**upload_directory** `String`

The name of the directory that the `build_command` generated with the static files in it. This is the directory that will be uploaded to S3.

**index_key** `String`

The key of the document to respond with at the root of the website and for URLs that look like folders. `index.html` is almost certainly what you want to use. For example, if `https://example.com` is requested, `https://example.com/index.html` will be returned. And if `https://example.com/some-page/` is requested, `https://example.com/some-page/index.html` will be returned.

If you do not like trailing slashes in your URLs the `trailing_slashes` configuration can remove them.

**error_key** `String`

The key of the document to respond with if the website endpoint responds with a 404 Not Found. For example, `404.html` is pretty common.

Don’t worry about accounting for the `trailing_slashes` configuration. If you disable trailing slashes, the `error_key` will be modified appropriately.

**trailing_slashes** `Boolean`

By default, most static site generators build websites with file extensions in the URL. So a page will look something like `https://example.com/some-page.html`. For a variety of reasons (aesthetics, backwards-compatibility with existing URLs, etc.), you might need something like `https://example.com/some-page` instead.

Amazon S3 has support for “Index Documents”, or what’s commonly called “Directory Indexes”. It’s a feature where if a request is made to what appears to be a folder, like `https://example.com/folder/`, it will look for a file _inside_ that “folder” based on the `index_key`. So if the `index_key` is `index.html`, a request to `https://example.com/folder/` will serve the document at `https://example.com/folder/index.html`. If your static site generator supports Directory Indexes, then you can configure it so that when it builds your site a file named `some-page.html` will be generated as `some-page/index.html`.

S3’s Directory Indexes support will also work without trailing slashes, but not how you might expect. If a request is made to `https://example.com/some-page`, it will first redirect to `https://example.com/some-page/` and then serve the file at `https://example.com/some-page/index.html`. If you don’t like the `html` extensions on your URLs, you probably aren’t going to be happy about the trailing slashes either. 😉

If you set `trailing_slashes` to `false`, when you deploy, your files that look like Directory Indexes will be on-the-fly re-mapped to have no extension. So a file `some-page/index.html` will be uploaded as just `some-page`, which will allow it to be served from `https://example.com/some-page`, without the trailing slash!

**cache** `Number` (optional when `cache_control` is set)

The number of seconds a browser should cache the files of your website for. This is a simplified version of the HTTP `Cache-Control` header. If you set it to `0` the `Cache-Control` will be set to `"no-cache, no-store, must-revalidate"`. If you set it to a positive number, say, `3600`, the `Cache-Control` will be set to `"public, max-age=3600"`.

Be careful about setting too high a cache length. If you do, when a browser caches it, if you then update the content, that browser will not get the updated content unless the user specifically hard-refreshes the page.

When `cdn` is enabled, the `s-maxage` directive is included and set to a very high number (one month). It is recommended you set `cache` to a very low number (e.g five minutes). The CDN will use the `s-maxage` directive and the browser will use the `max-age` directive. This works because when you deploy the CDN’s cache will be automatically expired. For more information see the `distribute` command.

If you need finer-grained control over the `Cache-Control` header, use the `cache_control` configuration option.

**cache_control** `String` (optional)

A `Cache-Control` directive as described in the [HTTP documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control). This is for more advanced, finer-grained control of caching. If you don’t need that, use the `cache` configuration option.

The `s-maxage` directive added to `cache` when `cdn` is enabled is not added here—you have to do it yourself. Caveat emptor.

**redirects** `Array<Object>` (optional)

* **prefix_match** `String`

  The URL path prefix to match on. The redirects are matched in order, so if you have two paths with similar parts, like `some/page` and `some`, make sure you put the more specific path first.

* **destination** `String`

  The path to redirect to if the `prefix_match` matches.

AWS does not allow the `prefix_match` and `destination` to start with a forward slash (`/some/page`). You can include them in the configuration for your convenience, but the forward slashes will be invisibly removed when configuring the bucket.

If you need finer-grained control over the routing rules, use the `routing_rules` configuration option.

**routing_rules** `Array<Object>` (optional)

If the `redirects` configuration is not enough, you can declare more complex routing rules. There are some [horrible AWS docs][routing-rules-docs] that explain the available options and here’s an example of the syntax from the [AWS JavaScript docs][JavaScript-docs].

```javascript
[
  {
    Redirect: { /* required */
      HostName: "STRING",
      HttpRedirectCode: "STRING",
      Protocol: "http" || "https",
      ReplaceKeyPrefixWith: "STRING",
      ReplaceKeyWith: "STRING"
    },
    Condition: {
      HttpErrorCodeReturnedEquals: "STRING",
      KeyPrefixEquals: "STRING"
    }
  },
  /* more items */
]
```

The unusual property casing is intentional—the entire configuration will be passed directly through in the HTTP request.

**cdn**: `Boolean`

Set this to `true` if you want to use a CDN and HTTPS/TLS. Setting up the CDN does not happen automatically when deploying. After deploying, run `discharge distribute` to set up the CDN. Once the CDN is set up, future deploys will expire the CDN’s cache.

For more information see the `cache` configuration or the `distribute` command.

**aws_profile** `String` (optional)

The AWS profile you’ve specified in a credentials file at `~/.aws/credentials`.

If you only have one set of credentials then specify “default”.

If you want to create a new AWS user with specific permissions/policies for deployment, you can add another profile in the credentials file and specify the custom profile you’ve added.

If you prefer environment variables or you are running Discharge in an automated environment like a continuous integration/deployment server you can omit this configuration option.

**aws_region** `String`

The [Amazon S3 region][s3-region] you want to create your website (bucket) in.

**dns_configured** `Boolean`

If you run `discharge init` this will be set to `false` automatically. Then when you run `discharge deploy` it will show the record you need to add to your DNS configuration. The deploy command will then automatically set this value to `true`, assuming you have properly created the DNS record.

**should_keep_files_in_s3** `Boolean`

Set to false by default, flag comtrols if discharge synchronizes the removal of files in the upload dir with s3. 

### Deploy

After you’ve finished configuring you can run `discharge deploy` to deploy. Deploying is a series of steps that are idempotent—that is, they are safe to run over and over again, and if you haven’t changed anything, then the outcome should always be the same.

If you change your website configuration (`cache`, `redirects`, etc.) it will be updated. If you change your website content, a diff will be done to figure out what needs to change. New files will be added, changed files will be updated, and deleted files will be removed. The synchronization is one way—that is, if you remove a file from S3 it will just be re-uploaded the next time you deploy.

### Distribute

After you’ve finished deploying you can run `discharge distribute` to distribute your website via a CDN (content delivery network). The command will create a TLS certificate, ensure it’s verified, create a distribution, and ensure it’s deployed. Almost no configuration necessary[1]. This step is completely optional, but if you have a high-traffic website it’s highly recommended, and if you want to secure your website with HTTPS/TLS then you have to do it[2].

A CDN is a caching layer. It can significantly speed up requests for users located geographically farther from where your website is deployed, and sometimes even for users nearby it. In brief, the way a CDN works is you point your DNS to the CDN. When a request comes in, the CDN relays the request to your origin (in this case S3) then takes the response and caches it according to the `Cache-Control` header in the response. Future requests will only hit the CDN and not your origin, until either the CDN’s cache expires or it’s expired early.

The `Cache-Control` header can specify two different cache lengths, one for the CDN and one for the browser. Because static sites are… static, the only times they change are when deployed, so it’s safe to set a very high cache length for the CDN, a low cache length for the browser, and then  expire the CDN’s cache early when deploying.

[1]: CDNs can be configured in _a lot_ of different, complex ways. The goal was to abstract away all of that—choose sane defaults and require no configuration. I think this will work for the vast majority of people, but if there’s a specific reason you need more flexibility let me know, and if it’s widely-needed we can add it.

[2]: While CDNs can be configured without TLS, given that TLS certificates are free and we want the entire web to be encrypted, I can’t see any reason to support not using TLS.

#### .io domains

Verifying the TLS certificate is done via email. AWS will look up the contact information in the WHOIS database for your domain and then send a verification email to the following email addresses:

* Domain registrant
* Technical contact
* Administrative contact
* administrator@domain.tld
* hostmaster@domain.tld
* postmaster@domain.tld
* webmaster@domain.tld
* admin@domain.tld

Inexplicably, the .io domain registrar is the only registrar that does not return contact information from the WHOIS database. That means you _have_ to have one of the five common system email addresses set up on a .io domain or you will not receive the TLS certificate verification email.

### Subdomains

You can use any domain, subdomain, or combination you like. You just need to configure your DNS appropriately.

If you want to use a naked domain (`domain.com`), because S3 and CloudFront expose a special URL rather than an IP address, your DNS provider will need to support ALIAS records; not all do.

If you want to use a subdomain like `www.domain.com` or `blog.domain.com`, create a CNAME record for it. The TLS/HTTPS certificate is created for the root domain and all subdomains via a wildcard.

If you want to use both a naked domain and a subdomain, create an ALIAS and a CNAME record.

If you want to use only a naked domain or a subdomain, but redirect one to the other (like redirect `www.domain.com` to `domain.com`), then the easiest way to do that is to add a redirect at the DNS-level. It’s not technically a part of the DNS specification so not all DNS providers have it, but the vast majority do. If yours does not, you can either switch to a DNS provider that does or [manually create an S3 bucket that does the redirect][s3-redirect] and create an ALIAS or CNAME record pointing to it.

## Contributing

Bug reports and pull requests are welcome on GitHub at [https://github.com/brandonweiss/discharge][github-discharge].

## License

The package is available as open source under the terms of the [MIT License][MIT-license].

[aws-credentials-file]: http://docs.aws.amazon.com/cli/latest/userguide/cli-config-files.html

[routing-rules-docs]: http://docs.aws.amazon.com/AmazonS3/latest/dev/how-to-page-redirect.html#advanced-conditional-redirects
[JavaScript-docs]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putBucketWebsite-property
[s3-region]: http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
[s3-redirect]: https://aws.amazon.com/premiumsupport/knowledge-center/redirect-domain-route-53/
[github-discharge]: https://github.com/brandonweiss/discharge
[MIT-license]: http://opensource.org/licenses/MIT
