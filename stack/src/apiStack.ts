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

export interface ApiStackProps extends cdk.StackProps {
  readonly certId: string
  readonly dnsName: string
  readonly env: cdk.Environment
  readonly stage: string
}

export default class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const stagePat = /^[a-z0-9]+$/
    if (!props.stage.match(stagePat)) {
      throw new Error(`Stage '${props.stage}' does not match pattern: ${stagePat}`)
    }
    const table = this.createUrlEntriesTable(props.stage)

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
    const func = this.createLambda(table, 'urlFunc', 'index.urlHandler')
    const funcIntegration = new apigateway.LambdaIntegration(func)

    const regionCertArn = `arn:aws:acm:${props.env.region}:${props.env.account}:certificate/${props.certId}`
    const certificate = certman.Certificate.fromCertificateArn(this, 'cert', regionCertArn)

    const api = new apigateway.RestApi(this, 'urlsApi', {
      restApiName: 'Url Shortener Service',
      deployOptions: {
        stageName: props.stage,
        tracingEnabled: false,
      },
      domainName: {
        certificate,
        domainName: props.dnsName,
        endpointType: EndpointType.REGIONAL,
      },
      description: 'Generates and serves shortened URL aliases.',
    })

    // ##> /
    api.root.addMethod('POST', new apigateway.LambdaIntegration(func))
    addCorsOptions(api.root)

    // ##> /:rootId
    const res = api.root.addResource('{shortId}')
    addCorsOptions(res)
    res.addMethod('GET', funcIntegration)

    const rec = this.addRoute53(props.dnsName, api)

    // TODO outputs
    // A manually named output
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

  addRoute53(dnsName: string, api: apigateway.RestApi) {
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
  createLambda(table: dynamodb.Table, funcName: string, handler: string) {
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

    // sam logs -tn <funcName>
    new cdk.CfnOutput(this, funcName, { value: func.functionName })

    table.grantReadWriteData(func)

    return func
  }

  createUrlEntriesTable(stage: string) {
    const dev = true
    const tableName = `UrlEntries-${stage}`
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
