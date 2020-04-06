#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import ApiStack from './apiStack'
import * as dotenv from 'dotenv'
import * as env from 'env-var'

export function envStr(key: string): string {
  return env
    .get(key)
    .required()
    .asString()
}

dotenv.config()

const app = new cdk.App()

new ApiStack(app, 'urls-api', {
  env: {
    region: envStr('REGION'),
    account: envStr('ACCOUNT'),
  },
  certId: envStr('CERT_ID'),
  dnsName: envStr('DNS_NAME'),
  stage: envStr('STAGE'),
})
