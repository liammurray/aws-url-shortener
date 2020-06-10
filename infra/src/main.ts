#!/usr/bin/env node
import 'source-map-support/register'
import * as aws from 'aws-sdk'
import * as cdk from '@aws-cdk/core'
import ApiStack from './apiStack'
import BuildPipelineStack from './buildPipelineStack'
import { getStringParams } from './utils'

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
  const [certId, domain] = await getStringParams(
    '/cicd/common/certs/us-west-2',
    '/cicd/common/domain'
  )

  const devApiStackName = 'urls-api-dev'

  new BuildPipelineStack(app, 'urls-build-pipeline-master', {
    devApiStackName,
  })

  // Under automation (CI):
  //  buildspec runs 'npm run cdk synth urls-api-dev'
  //  deploy stage uses output from that (urls-api-dev.template.json) to deploy
  //
  new ApiStack(app, devApiStackName, {
    certId,
    domain,
    prefix: 'u', // Used to form DNS name: u.nod15c.com
    stage: 'dev',
    env,
  })
})
