import * as cdk from '@aws-cdk/core'
import * as apigateway from '@aws-cdk/aws-apigateway'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as lambda from '@aws-cdk/aws-lambda'
import * as logs from '@aws-cdk/aws-logs'
import * as route53 from '@aws-cdk/aws-route53'
import * as certman from '@aws-cdk/aws-certificatemanager'
import {
  EndpointType,
  CfnAuthorizer,
  AuthorizationType,
} from '@aws-cdk/aws-apigateway'
import { addCorsOptions } from './apiGatewayUtils'
import * as path from 'path'
import { resolveSsm } from '@liammurray/cdk-common'

type EnvMap = {
  [key: string]: string
}
export interface ApiStackProps extends cdk.StackProps {
  // Required for route53 hosted zone lookup (can't use environment generic stack)
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

    const INDEX_NAME_CLIENT = 'ClientIdIndex'
    const table = this.createUrlEntriesTable('ShortUrls', INDEX_NAME_CLIENT)

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

    // Depends on cognito pool stack
    const userPoolId = cdk.Fn.importValue('UrlShortnerUserPoolId')
    const cognitoAuth = this.createCognitoAuthorizer(api, userPoolId)

    const ver = new Date().toISOString()

    const envVars = {
      SERVICE_NAME: 'UrlShortener',
      TABLE_NAME_URLS: table.tableName,
      INDEX_NAME_CLIENT,
      // Used when: AWS_SAM_LOCAL=true
      LOCAL_DDB_ENDPOINT: 'http://host.docker.internal:8000',
    }
    const func = this.createLambda(table, envVars, 'UrlFunc', 'index.urlHandler', ver)
    const funcIntegration = new apigateway.LambdaIntegration(func)

    addCorsOptions(api.root)

    // Define models
    //   https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigateway-readme.html
    //   get swagger from api

    // POST / (Add entry)
    api.root.addMethod('POST', funcIntegration, {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: cognitoAuth.ref,
      },
    })

    // GET / (List entries)
    api.root.addMethod('GET', funcIntegration, {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: cognitoAuth.ref,
      },
    })

    // GET /:rootId (Redirect)
    const res = api.root.addResource('{shortId}')
    addCorsOptions(res)
    res.addMethod('GET', funcIntegration)

    const rec = this.addRoute53(dnsName, api)

    // Outputs (nice)
    this.output('ApiId', api.restApiId)
    this.output('ApiUrl', api.url)
    this.output('DomainName', rec.domainName)
  }

  private createCognitoAuthorizer(api: apigateway.RestApi, userPoolId: string): CfnAuthorizer {
    const { account, region } = cdk.Stack.of(this)
    const userPoolArn = `arn:aws:cognito-idp:${region}:${account}:userpool/${userPoolId}`
    return new CfnAuthorizer(this, 'cfnAuth', {
      restApiId: api.restApiId,
      name: 'UrlsApiAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPoolArn],
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
  private createLambda(
    table: dynamodb.Table,
    envVars: EnvMap,
    funcName: string,
    handler: string,
    ver: string
  ) {
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
        ...envVars,
        TABLE_NAME_URL_ENTRIES: table.tableName,
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

  /**
   * Needs to conform with dynamodb datamapper "UrlEntry" in urlsDatabase.ts
   * It might be better to let code manage database (not manager in infra)
   */
  private createUrlEntriesTable(tableBaseName: string, clientIdIndexName: string): dynamodb.Table {
    const dev = true
    const tableName = `${tableBaseName}-${this.props.stage}`
    const removalPolicy = dev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN
    const table = new dynamodb.Table(this, 'urls', {
      tableName,
      removalPolicy,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    })
    table.addGlobalSecondaryIndex({
      indexName: clientIdIndexName,
      partitionKey: {
        name: 'clientId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.NUMBER,
      },
    })
    this.output(`${tableBaseName}`, table.tableName)
    this.output(`${tableName}Arn`, table.tableArn)
    return table
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
