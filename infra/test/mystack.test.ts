import { expect as cdkExpect, haveResource } from '@aws-cdk/assert'
import { SynthUtils } from '@aws-cdk/assert'

import * as cdk from '@aws-cdk/core'
import ApiStack from '../src/apiStack'

// TODO expand and add build pipeline stack

test('API stack matches snapshot', () => {
  const app = new cdk.App()

  const stack = new ApiStack(app, 'urls-api-dev', {
    certId: 'ssm:/cicd/common/certs/us-west-2',
    domain: 'ssm:/cicd/common/domain',
    prefix: 'u',
    stage: 'dev',
    env: {
      account: '12345',
      region: process.env.AWS_REGION || 'us-west-2',
    },
  })

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()

  cdkExpect(stack).to(
    haveResource('AWS::ApiGateway::RestApi', {
      Name: 'Url Shortener Service',
    })
  )
})
