#!/usr/bin/env node
import 'source-map-support/register'
import * as aws from 'aws-sdk'
import * as cdk from '@aws-cdk/core'
import { getStringParams } from './utils'
import SiteStack from './stacks/siteStack'

const app = new cdk.App()

export async function getCallerAccount(): Promise<string> {
  const sts = new aws.STS({ apiVersion: '2011-06-15' })
  const data = await sts.getCallerIdentity({}).promise()
  if (!data?.Account) {
    throw new Error('Unexpected: missing account')
  }
  return data.Account
}

getCallerAccount().then(async account => {
  const env = {
    account,
    region: process.env.AWS_REGION || 'us-west-2',
  }

  // We need to resolve these params during synth (since used in
  // string substitutions). Otherwise you end up with:
  //   u.${Token[TOKEN.134]}
  //
  // CodePipeline/CodeBuild, etc. should hae IAM access (search 'codeBuildSsmResourcePaths' in other projects)
  //
  const [certId, domain] = await getStringParams(
    '/cicd/common/certs/us-east-1',
    '/cicd/common/domain'
  )

  // As alternate to SSM CDK supports `-c` arguments (context)
  //   domainName: this.node.tryGetContext('domain'),
  //   siteSubDomain: this.node.tryGetContext('subdomain'),

  // Under automation (CI):
  //  buildspec runs 'npm run cdk synth <stack-name>'
  //  deploy stage uses output from that (stack-name.template.json) to deploy changeset
  //
  new SiteStack(app, 'urlshort-site', {
    env,
    siteProps: {
      domain,
      subDomain: 'urls', // urls.mydomain.com
      certId,
      retainDeployBucket: false,
      codeRoot: '../code/build',
    },
  })
})
