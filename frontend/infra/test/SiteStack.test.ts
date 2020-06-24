import { expect as cdkExpect, haveResource, MatchStyle, matchTemplate } from '@aws-cdk/assert'
import { SynthUtils } from '@aws-cdk/assert'

import * as cdk from '@aws-cdk/core'
import SiteStack from '../src/stacks/siteStack'

describe('Build pipeline stack', () => {
  let stack: SiteStack

  const stackProps = {
    env: {
      region: 'us-west-2',
      account: 'account12345',
    },
    siteProps: {
      domain: 'mydomain.com',
      subDomain: 'urls', // urls.mydomain.com
      retainDeployBucket: false,
      certId: 'cert12345',
      codeRoot: '../code/build',
    },
  }
  beforeAll(() => {
    const app = new cdk.App()

    stack = new SiteStack(app, 'test-stack', stackProps)
  })
  xtest('Matches snapshot', () => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
  })
  test('Has resources', () => {
    cdkExpect(stack).to(
      haveResource('AWS::Route53::RecordSet', {
        Name: 'urls.mydomain.com.',
      })
    )
  })
  xtest('Match resources', () => {
    cdkExpect(stack).to(
      matchTemplate(
        {
          Resources: {},
        },
        MatchStyle.EXACT
      )
    )
  })
})
