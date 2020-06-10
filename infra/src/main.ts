#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import ApiStack from './apiStack'
import BuildPipelineStack from './buildPipelineStack'

import * as dotenv from 'dotenv'
import * as env from 'env-var'
import * as ssm from '@aws-cdk/aws-ssm'

export function envStr(key: string): string {
  return env.get(key).required().asString()
}

dotenv.config()

const app = new cdk.App()

//const ssmVal = ssm.StringParameter.valueForStringParameter.bind(null, app)

new BuildPipelineStack(app, 'urls-build-pipeline-master')

// ACCOUNT="958019638877"
// REGION="us-west-2"
// CERT_ID="bf2794b2-e3d6-45cc-a849-f7add37d76d0"
// DNS_NAME="u.nod15c.com"
// STAGE="dev"

new ApiStack(app, 'urls-api', {
  env: {
    region: envStr('REGION'),
    account: envStr('ACCOUNT'),
  },
  certId: envStr('CERT_ID'),
  dnsName: envStr('DNS_NAME'),
  stage: envStr('STAGE'),
})
