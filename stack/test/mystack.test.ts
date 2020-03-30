import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import MyStack from '../src/apiStack'

test('Empty Stack', () => {
  const app = new cdk.App()
  // WHEN
  const stack = new MyStack(app, 'test-stack', {
    env: {
      region: 'us-west-2',
      account: 'xyz',
    },
  })
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  )
})
