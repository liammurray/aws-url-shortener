import { expect as cdkExpect, haveResource } from '@aws-cdk/assert'
import { SynthUtils } from '@aws-cdk/assert'

import * as cdk from '@aws-cdk/core'
import CognitoPoolStack from '../src/cognitoPoolStack'

// TODO expand and add build pipeline stack

// const devApiStackName = 'urls-api-dev'

// new BuildPipelineStack(app, 'urls-build-pipeline-master', {
//   devApiStackName,
// })

describe('Cognito pool stack', () => {
  let stack: CognitoPoolStack

  beforeAll(() => {
    const app = new cdk.App()

    stack = new CognitoPoolStack(app, 'test-stack', {
      serviceName: 'UrlShortner',
    })
  })
  xtest('stack matches snapshot', () => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
  })
  test('API stack check', () => {
    cdkExpect(stack).to(
      haveResource('AWS::Cognito::UserPool', {
        MfaConfiguration: 'ON',
      })
    )
  })
})
