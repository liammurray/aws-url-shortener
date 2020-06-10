import * as cdk from '@aws-cdk/core'
import * as apigateway from '@aws-cdk/aws-apigateway'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as lambda from '@aws-cdk/aws-lambda'
import * as logs from '@aws-cdk/aws-logs'
import * as route53 from '@aws-cdk/aws-route53'
import * as certman from '@aws-cdk/aws-certificatemanager'
import { EndpointType } from '@aws-cdk/aws-apigateway'
import { addCorsOptions } from './apiGatewayUtils'
import * as path from 'path'
import { resolveSsm } from '@liammurray/cdk-common'

export interface ApiStackProps extends cdk.StackProps {
  // Required for route53 hosted zone lookup
  readonly env: cdk.Environment
  readonly certId: string
  readonly domain: string
  readonly prefix: string
  readonly stage: string
  readonly autoAlias?: boolean
}

export default class ApiStack extends cdk.Stack {
  private props: ApiStackProps

  constructor(scope: cdk.Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    // Expand "ssm:" entries
    resolveSsm(this, props)

    // Pipeline sets info in CI. Search for 'parameterOverrides'.
    //
    //  CommitInfo: commitInfo,
    //
    // Without defaults you need to pass them to cdk synth, deploy and related
    //  --parameters myParm=value
    //

    const commitInfoParam = new cdk.CfnParameter(this, 'CommitInfo', {
      type: 'String',
      default: '',
      description: 'Commit info from CI',
    })

    const stagePat = /^[a-z0-9]+$/
    if (!props.stage.match(stagePat)) {
      throw new Error(`Stage '${props.stage}' does not match pattern: ${stagePat}`)
    }

    this.props = props

    const table = this.createUrlEntriesTable()

    // TOTO
    //  schema https://github.com/aws/aws-cdk/issues/1461
    //         https://gist.github.com/abbottdev/17379763ebc14a5ecbf2a111ffbcdd86
    //         ?url=http://foo.com
    //  nod15c lambda bucket (not autogenerated)
    //  authorizer
    //
    // Good docs:
    //   https://docs.aws.amazon.com/cdk/api/latest/python/aws_cdk.aws_apigateway.README.html
    //

    const { account, region } = cdk.Stack.of(this)

    const regionCertArn = `arn:aws:acm:${region}:${account}:certificate/${props.certId}`
    const certificate = certman.Certificate.fromCertificateArn(this, 'cert', regionCertArn)

    const dnsName = `${props.prefix}.${props.domain}`

    const api = new apigateway.RestApi(this, 'UrlsApi', {
      restApiName: 'Url Shortener Service',
      deployOptions: {
        stageName: props.stage,
        tracingEnabled: false,
      },
      domainName: {
        certificate,
        domainName: dnsName,
        endpointType: EndpointType.REGIONAL,
      },
      description: 'Generates and serves shortened URL aliases.',
    })

    const tags = {
      CommitInfo: commitInfoParam.valueAsString,
    }

    Object.entries(tags).forEach(([key, val]) => {
      cdk.Tag.add(api, key, val)
    })

    const ver = new Date().toISOString()

    const func = this.createLambda(table, 'UrlFunc', 'index.urlHandler', ver)
    const funcIntegration = new apigateway.LambdaIntegration(func)

    // Creates URL
    //
    // POST /
    //
    api.root.addMethod('POST', funcIntegration)
    addCorsOptions(api.root)

    //
    // Redirects to URL
    //
    // GET /:rootId
    //
    const res = api.root.addResource('{shortId}')
    addCorsOptions(res)
    res.addMethod('GET', funcIntegration)

    const rec = this.addRoute53(dnsName, api)

    // Outputs (nice)
    new cdk.CfnOutput(this, 'ApiId', {
      value: api.restApiId,
    })
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    })
    new cdk.CfnOutput(this, 'DomainName', {
      value: rec.domainName,
    })
  }

  private addRoute53(dnsName: string, api: apigateway.RestApi) {
    const apex = `${dnsName.split('.').filter(Boolean).slice(-2).join('.')}.`
    const zone = route53.HostedZone.fromLookup(this, 'zone', {
      domainName: apex,
    })
    if (!api.domainName) {
      throw new Error('Whoops!')
    }
    return new route53.ARecord(this, 'aRecord', {
      zone,
      recordName: dnsName,
      target: route53.AddressRecordTarget.fromAlias({
        bind: (): route53.AliasRecordTargetConfig => ({
          dnsName: api.domainName!.domainNameAliasDomainName,
          hostedZoneId: api.domainName!.domainNameAliasHostedZoneId,
        }),
      }),
    })
  }
  private createLambda(table: dynamodb.Table, funcName: string, handler: string, ver: string) {
    const lambdaDist = path.resolve(__dirname, '../../funcs/shorten/lambda')
    const code = lambda.Code.fromAsset(lambdaDist)
    const func = new lambda.Function(this, funcName, {
      code,
      handler,
      runtime: lambda.Runtime.NODEJS_12_X,
      // tracing: lambda.Tracing.ACTIVE
      // reservedConcurrentExecutions: 100
      logRetention: logs.RetentionDays.FIVE_DAYS,
      environment: {
        TABLE_NAME_URL_ENTRIES: table.tableName,
        SERVICE_NAME: 'UrlShortener',
        // Used when AWS_SAM_LOCAL=true
        LOCAL_DDB_ENDPOINT: 'http://host.docker.internal:8000',
      },
    })

    if (this.props.autoAlias) {
      const version = func.addVersion(ver)
      new lambda.Alias(this, `${funcName}Alias`, {
        aliasName: this.props.stage,
        version,
      })
    }

    // sam logs -tn <funcName>
    const outputName = `${funcName}Id`
    new cdk.CfnOutput(this, outputName, { value: func.functionName })

    table.grantReadWriteData(func)

    return func
  }

  private createUrlEntriesTable() {
    const dev = true
    const tableName = `UrlEntries-${this.props.stage}`
    const removalPolicy = dev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN
    return new dynamodb.Table(this, 'urls', {
      tableName,
      removalPolicy,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // readCapacity: 5,
      // writeCapacity: 5,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.NUMBER,
      },
    })
  }
}
