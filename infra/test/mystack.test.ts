import { expect as cdkExpect, haveResource } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import ApiStack from '../src/apiStack'

// TODO expand and add build pipeline stack

test('create API stack', () => {
  const app = new cdk.App()
  const stack = new ApiStack(app, 'test-urls-api-stack', {
    env: {
      region: 'us-west-2',
      account: 'xyz',
    },
    certId: 'certid',
    dnsName: 'u.example.com',
    stage: 'dev',
  })

  cdkExpect(stack).to(
    haveResource('AWS::ApiGateway::RestApi', {
      Name: 'Url Shortener Service',
    })
  )
})
