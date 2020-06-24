import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as route53 from '@aws-cdk/aws-route53'
import * as s3 from '@aws-cdk/aws-s3'
import * as s3deploy from '@aws-cdk/aws-s3-deployment'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cdk from '@aws-cdk/core'
import * as targets from '@aws-cdk/aws-route53-targets/lib'
import { Construct } from '@aws-cdk/core'

export interface StaticSiteProps extends cdk.StackProps {
  /**
   * Apex domain (e.g. example.com)
   */
  readonly domain: string
  /**
   * Name under apex (e.g. www for www.example.com)
   */
  readonly subDomain: string
  /**
   * Where code to be deployed is relative to cdk project
   * root (e.g. ../site/build).
   */
  readonly codeRoot: string
  readonly certId?: string
  readonly retainDeployBucket: boolean
}

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
export class StaticSite extends Construct {
  constructor(parent: Construct, name: string, props: StaticSiteProps) {
    super(parent, name)

    // The website domain, e.g.: foo.example.com
    const siteDomain = `${props.subDomain}.${props.domain}`

    // TLD with dot, e.g.: example.com.
    const apex = `${siteDomain.split('.').filter(Boolean).slice(-2).join('.')}.`
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: apex,
    })
    this.output('Site', `https://${siteDomain}`)

    // Content bucket
    //
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index.html',
      // websiteErrorDocument: 'error.html',
      publicReadAccess: true,

      // Destroy will still fail/error if the bucket is not empty.
      removalPolicy: props.retainDeployBucket
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    })
    this.output('Bucket', siteBucket.bucketName)

    const { account, region } = cdk.Stack.of(this)

    let certificateArn
    if (props.certId) {
      // Use existing cert in use-east-1
      certificateArn = `arn:aws:acm:us-east-1:${account}:certificate/${props.certId}`
      // const certificate = acm.Certificate.fromCertificateArn(this, 'cert', certArnEast)
    } else {
      // TLS certificate in us-east-1 (required by cloudfront)
      //
      if (region != 'us-east-1') {
        throw new Error('Stack must be in us-east-1 when creating ACM cert')
      }
      certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
        domainName: siteDomain,
        hostedZone: zone,
        region: 'us-east-1',
      }).certificateArn
      this.output('Certificate', certificateArn)
    }

    // CloudFront
    //
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteDomain],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    })
    this.output('DistributionId', distribution.distributionId)

    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    })

    // Deployes source to bucket, then invalidates
    //
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset(props.codeRoot)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    })
  }

  private export(exportName: string, value: string): void {
    new cdk.CfnOutput(this, exportName, {
      value,
      exportName,
    })
  }
  private output(name: string, value: string): void {
    new cdk.CfnOutput(this, name, {
      value,
    })
  }
}
