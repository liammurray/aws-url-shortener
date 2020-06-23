import { expect as cdkExpect, haveResource } from '@aws-cdk/assert'
import { SynthUtils } from '@aws-cdk/assert'

import * as cdk from '@aws-cdk/core'
import ApiStack from '../src/apiStack'

// TODO expand and add build pipeline stack

// const devApiStackName = 'urls-api-dev'

// new BuildPipelineStack(app, 'urls-build-pipeline-master', {
//   devApiStackName,
// })

describe('API stack', () => {
  let stack: ApiStack

  beforeAll(() => {
    const app = new cdk.App()

    stack = new ApiStack(app, 'urls-api-dev', {
      certId: 'cert',
      domain: 'domain',
      prefix: 'u',
      stage: 'dev',
      env: {
        account: '12345',
        region: process.env.AWS_REGION || 'us-west-2',
      },
    })
  })
  xtest('API stack matches snapshot', () => {
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
