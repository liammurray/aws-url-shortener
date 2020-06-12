import * as cdk from '@aws-cdk/core'
import * as cognito from '@aws-cdk/aws-cognito'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as path from 'path'
import { Route53Resolver } from 'aws-sdk'

interface CognitoPoolStackProps extends cdk.StackProps {
  // UrlShortner + UserPool
  readonly serviceName: string
}

/**
 * Cognito pool for UrlShortner
 */
export default class CognitoPoolStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, private readonly props: CognitoPoolStackProps) {
    super(scope, id, props)

    // Must be us-east-1
    // const certArn = `arn:aws:acm:us-east-1:${this.account}:certificate/${props.certIdEast}`

    const userPoolName = `${props.serviceName}UserPool`
    const smsRoleExternalId = `${userPoolName}ExternalId`

    const authFuncs = this.createAuthFuncs()

    // Cognito User Pool
    //
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName,
      // Attributes verified at sign up
      autoVerify: {
        // Phone number must be verified if MFA using sms verification (not needed for TOTP)
        email: true,
      },
      emailSettings: {
        replyTo: 'noreply@nod15c.com',
      },
      // Gives lambda permissions to be invoked by cognito-idp.amazonaws.com
      lambdaTriggers: {
        preSignUp: authFuncs.signUp,
        preAuthentication: authFuncs.preAuth,
      },
      mfa: cognito.Mfa.REQUIRED,
      mfaSecondFactor: {
        otp: true,
        sms: true,
      },
      // Any unique id within account (GUID may be better)
      smsRoleExternalId, // CDK creates role for you to allow publish to sns
      selfSignUpEnabled: true,
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
      },
    })
    const cfnPool = userPool.node.defaultChild as cognito.CfnUserPool
    //EmailVerificationMessage: "Here is your verification code: {####}."
    //EmailVerificationSubject: "Verification Code for UrlShortner"
    this.output('PoolArn', userPool.userPoolArn)
    // this.export(`${userPoolName}Arn`, userPool.userPoolArn)

    // One app client for UrlShortner app
    const client = this.createAppClient(userPool)
    // For exchanging cognito token for temporary AWS credentials
    this.createIdentityPool(userPool, client)
    this.createAuthRoles(cfnPool)
  }

  private createAppClient(pool: cognito.UserPool): cognito.IUserPoolClient {
    const name = 'ApiClient'
    const client = pool.addClient('ApiClient', {
      userPoolClientName: name,
      generateSecret: false,
      // Hide UserNotFoundException when user doesn't exist
      preventUserExistenceErrors: true,
    })
    // const cfnClient = client.node.defaultChild as cognito.CfnUserPoolClient
    this.output(`ClientId${name}`, client.userPoolClientId)
    return client
  }

  private createIdentityPool(
    userPool: cognito.UserPool,
    client: cognito.IUserPoolClient
  ): cognito.CfnIdentityPool {
    return new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      identityPoolName: `${this.props.serviceName}IdentityPool`,
      cognitoIdentityProviders: [
        {
          clientId: client.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    })
  }

  private createAuthRolePrincipal(
    pool: cognito.CfnUserPool,
    stringLike: 'authenticated' | 'unauthenticated'
  ) {
    return new iam.FederatedPrincipal(
      'cognito-identity.amazonaws.com',
      {
        StringEquals: { 'cognito-identity.amazonaws.com:aud': pool.ref },
        'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': stringLike },
      },
      'sts:AssumeRoleWithWebIdentity'
    )
  }

  private createUnAuthRole(pool: cognito.CfnUserPool) {
    const role = new iam.Role(this, 'UnAuthenticatedRole', {
      assumedBy: this.createAuthRolePrincipal(pool, 'unauthenticated'),
    })
    return role
  }

  private createAuthRole(pool: cognito.CfnUserPool) {
    const role = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: this.createAuthRolePrincipal(pool, 'authenticated'),
    })

    // TODO execute API or other AWS allowed actions (listBuckets, etc)
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        // Examples
        actions: ['mobileanalytics:PutEvents', 'cognito-sync:*', 'cognito-identity:*'],
        resources: ['*'],
      })
    )
    return role
  }

  private createAuthRoles(pool: cognito.CfnUserPool) {
    const unauthRole = this.createUnAuthRole(pool)
    const authRole = this.createAuthRole(pool)
    new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
      identityPoolId: pool.ref,
      roles: {
        unauthenticated: unauthRole.roleArn,
        authenticated: authRole.roleArn,
      },
    })
  }

  private createAuthFuncs() {
    const code = lambda.Code.fromAsset(path.join(__dirname, '../funcs/auth'))

    const signUp = new lambda.Function(this, 'SignUpFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'auth.pre_signup',
      code,
    })

    const preAuth = new lambda.Function(this, 'PreAuthFunction', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'auth.pre_auth',
      code,
    })
    return {
      signUp,
      preAuth,
    }
  }

  /**
   * Exports must be unique in region.
   * A reference prevents referenced stack (this) from being deleted.
   * Fn.importValue('ClientCredentialsDevArn')
   * Fn.importValue('ClientCredentialsDomainName')
   *
   */
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
