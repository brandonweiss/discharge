# ![discharge](./assets/logo.svg?sanitize=true)

> A simple, easy way to deploy static websites to Amazon S3

![screenshot](./assets/screenshot.gif)

## Features

* Very little understanding of AWS required
* Interactive UI for configuring deployment
* Step-by-step list of what’s happening
* Support for no trailing slashes in URLs
* Use an AWS Profile (named credentials) to authenticate with AWS
* CloudFront and HTTPS support (coming soon)

## Installation

Install it globally:

```
$ npm install --global discharge
```

Or add it to your application’s `package.json`:

```
$ npm install --save-dev discharge
```

## Usage

### Authentication

[Configuring AWS credentials][aws-credentials] can be a bit confusing. After getting your Access Key ID and Secret Access Key from AWS, you should store them in a file at `~/.aws/credentials`. It should look something like this:

```
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Replace the example keys with your own.

### Configure

Configuration is done via a `.discharge.json` file located at the root of your application. You can run `discharge init` to get an interactive UI that will help you generate the configuration file, or you can write it yourself from scratch. It will look something like this:

```json
{
  "domain": "anti-pattern.com",
  "cloudfront": true,
  "cloudfront_compress": true,
  "cloudfront_https": "redirect-to-https",
  "build_command": "bundle exec middleman build",
  "upload_directory": "build",
  "index_key": "index.html",
  "error_key": "404.html",
  "trailing_slashes": false,
  "cache": 3600,
  "aws_profile": "website-deployment",
  "aws_region": "us-west-1",
  "dns_configured": false
}
```

Those are most of the configuration options but a complete list is next.

#### Configuration options

There are no defaults—all configuration options are explicit and must be provided unless marked as optional.

**domain** `String`

The domain name of your website. This will be used as the name of the S3 bucket your website will be uploaded to.

**cloudfront** `Boolean`

By default, a (CloudFront)[http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html] distribution will be created for your deployment, and will be updated every deploy.

**cloudfront_compress** `Boolean` (optional)

If CloudFront is activated, does the distribution [automatically compresses objects](http://docs.aws.amazon.com/console/cloudfront/compressed-content)?

**cloudfront_https** `String` (optional)

CloudFront Viewer Protocol Policy, defaulting to "Redirect HTTP to HTTPS"

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

If you need finer-grained control over the `Cache-Control` header, use the `cache_control` configuration option.

**cache_control** `String` (optional)

A `Cache-Control` directive as described in the [HTTP documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control). This is for more advanced, finer-grained control of caching. If you don’t need that, use the `cache` configuration option.

**redirects** `Array<Object>` (optional)

* **prefix_match** `String`

  The URL path prefix to match on. The redirects are matched in order, so if you have two paths with similar parts, like `some/page` and `some`, make sure you put the more specific path first.

* **destination** `String`

  The path to redirect to if the `prefix_match` matches.

AWS does not allow the `prefix_match` and `destination` to start with a forward slash (`/some/page`). You can include them in the configuration for your convenience, but the forward slashes will be invisibly removed when configuring the bucket.

If you need finer-grained control over the routing rules, use the `routing_rules` configuration option.

**routing_rules** `Array<Object>` (optional)

If the `redirects` configuration is not enough, you can declare more complex routing rules. There are some [horrible AWS docs][routing-rules-docs] that explain the available options and here’s an example of the syntax from the [AWS JavaScript docs][JavaScript-docs]].

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

**aws_profile** `String`

Your AWS credentials should be stored in `~/.aws/credentials`. It should look something like this:

```
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

If you only have one set of credentials then specify “default”.

If you want to create a new AWS user with specific permissions/policies for deployment, you can add another profile in the credentials file and specify the custom profile you’ve added.

**aws_region** `String`

The [Amazon S3 region][s3-region] you want to create your website (bucket) in.

**dns_configured** `Boolean`

If you run `discharge init` this will be set to `false` automatically. Then when you run `discharge deploy` it will show the record you need to add to your DNS configuration. The deploy command will then automatically set this value to `true`, assuming you have properly created the DNS record.

### Deploy

After you’ve finished configuring you can run `discharge deploy` to deploy. Deploying is a series of steps that are idempotent—that is, they are safe to run over and over again, and if you haven’t changed anything, then the outcome should always be the same.

If you change your website configuration (`cache`, `redirects`, etc.) it will be updated. If you change your website content, a diff will be done to figure out what needs to change. New files will be added, changed files will be updated, and deleted files will be removed. The synchronization is one way—that is, if you remove a file from S3 it will just be re-uploaded the next time you deploy.
If a CloudFront distribution is active, an [invalidation](http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html) will be created for the changed entries, so your distribution will contain the most up-to-date version.

## Contributing

Bug reports and pull requests are welcome on GitHub at [https://github.com/brandonweiss/discharge][github-discharge].

## License

The package is available as open source under the terms of the [MIT License][MIT-license].

[aws-credentials]: http://docs.aws.amazon.com/cli/latest/userguide/cli-config-files.html

[routing-rules-docs]: http://docs.aws.amazon.com/AmazonS3/latest/dev/how-to-page-redirect.html#advanced-conditional-redirects
[JavaScript-docs]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putBucketWebsite-property
[s3-region]: http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
[github-discharge]: https://github.com/brandonweiss/discharge
[MIT-license]: http://opensource.org/licenses/MIT
