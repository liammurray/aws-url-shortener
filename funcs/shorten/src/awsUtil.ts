import AWS from 'aws-sdk'
import { envStr } from './util'

//
// Generic AWS SDK utils
//

function ensureRegion(region?: string) {
  return region || envStr('AWS_REGION')
}

export function createDynamoClient(region?: string): AWS.DynamoDB {
  let ep
  if (process.env.AWS_SAM_LOCAL == 'true') {
    ep = {
      endpoint: process.env.LOCAL_DDB_ENDPOINT,
    }
  }
  return new AWS.DynamoDB({
    apiVersion: '2012-08-10',
    region: ensureRegion(region),
    ...ep,
  })
}

export function createSSM(region?: string): AWS.SSM {
  return new AWS.SSM({ apiVersion: '2014-11-06', region: ensureRegion(region) })
}

const ssmClient = createSSM()

export async function getSecureJsonParam(path: string) {
  const res = await ssmClient.getParameter({ Name: path, WithDecryption: true }).promise()
  if (res && res.Parameter && res.Parameter.Value && res.Parameter.Type === 'SecureString') {
    return JSON.parse(res.Parameter.Value)
  }
  throw new Error(`Failed to lookup parameter ${path}`)
}
