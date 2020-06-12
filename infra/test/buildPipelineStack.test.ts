import { expect as cdkExpect, haveResource } from '@aws-cdk/assert'
import { SynthUtils } from '@aws-cdk/assert'

import * as cdk from '@aws-cdk/core'
import BuildPipelineStack from '../src/BuildPipelineStack'

describe('Build pipeline stack', () => {
  let stack: BuildPipelineStack

  beforeAll(() => {
    const app = new cdk.App()

    stack = new BuildPipelineStack(app, 'test-stack', {
      devApiStackName: 'urls-api-dev',
    })
  })
  xtest('stack matches snapshot', () => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
  })
  test('API stack check', () => {
    cdkExpect(stack).to(
      haveResource('AWS::CodePipeline::Pipeline', {
        Name: 'UrlShortenerMaster',
      })
    )
  })
})
