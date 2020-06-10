#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import ApiStack from './apiStack'
import BuildPipelineStack from './buildPipelineStack'

import * as ssm from '@aws-cdk/aws-ssm'

const app = new cdk.App()

const ssmVal = ssm.StringParameter.valueForStringParameter.bind(null, app)

new BuildPipelineStack(app, 'urls-build-pipeline-master')

new ApiStack(app, 'urls-api-dev', {
  certId: ssmVal('/cicd/common/certs/us-west-2'),
  domain: ssmVal('/cicd/common/domain'),
  prefix: 'u', // u.nod15c.com
  stage: 'dev',
})
