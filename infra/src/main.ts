#!/usr/bin/env node
import 'source-map-support/register'
import * as aws from 'aws-sdk'
import * as cdk from '@aws-cdk/core'
import ApiStack from './apiStack'
import BuildPipelineStack from './buildPipelineStack'

import * as ssm from '@aws-cdk/aws-ssm'

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

  const ssmVal = ssm.StringParameter.valueForStringParameter.bind(null, app)

  new BuildPipelineStack(app, 'urls-build-pipeline-master')

  new ApiStack(app, 'urls-api-dev', {
    certId: ssmVal('/cicd/common/certs/us-west-2'),
    domain: ssmVal('/cicd/common/domain'),
    prefix: 'u', // u.nod15c.com
    stage: 'dev',
    env,
  })
})
