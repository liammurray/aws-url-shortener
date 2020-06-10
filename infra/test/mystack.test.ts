import { expect as cdkExpect, haveResource } from '@aws-cdk/assert'
import { SynthUtils } from '@aws-cdk/assert'

import * as cdk from '@aws-cdk/core'
import ApiStack from '../src/apiStack'

// TODO expand and add build pipeline stack

describe('API stack', () => {
  let stack: ApiStack

  beforeAll(() => {
    const app = new cdk.App()

    stack = new ApiStack(app, 'urls-api-dev', {
      certId: 'ssm:/cicd/common/certs/us-west-2',
      domain: 'ssm:/cicd/common/domain',
      prefix: 'u',
      stage: 'dev',
      env: {
        account: '12345',
        region: process.env.AWS_REGION || 'us-west-2',
      },
    })
  })
  test('API stack matches snapshot', () => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
  })
  test('API stack check', () => {
    cdkExpect(stack).to(
      haveResource('AWS::ApiGateway::RestApi', {
        Name: 'Url Shortener Service',
      })
    )
  })
})
