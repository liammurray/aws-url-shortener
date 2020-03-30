#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import ApiStack from './apiStack'

const app = new cdk.App()

const myAccount = '958019638877'

new ApiStack(app, 'urls-api', {
  env: {
    region: 'us-west-2',
    account: myAccount,
  },
  certId: 'bf2794b2-e3d6-45cc-a849-f7add37d76d0',
  dnsName: 'u.nod15c.com',
  stage: 'dev',
})
