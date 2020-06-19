// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="chai-missing.d.ts"/>
import { UrlsDatabase, UrlEntry } from '../src/urlsDatabase'

import { hostname } from 'os'
import { hrtime } from 'process'
import { createDynamoClient } from '../src/awsUtil'
import { DataMapper, DynamoDbTable, DynamoDbSchema } from '@aws/dynamodb-data-mapper'
import { expect } from 'chai'
import 'mocha'

/**
 * Response from createAuto, createAlias
 */
export const CREATE_SHORTLINK_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['id', 'code'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    msg: { type: 'string' },
    code: { type: 'string', enum: ['created', 'aliasExists', 'aliasInvalid', 'urlInvalid'] },
    url: { type: 'string' },
  },
}

/**
 * Response from getEntries
 */
const LIST_SHORTLINKS_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['items'],
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      description: 'List of items',
      items: {
        type: 'object',
        required: ['id', 'clientId', 'createdAt', 'url'],
        properties: {
          id: { type: 'string' },
          clientId: { type: 'string' },
          createdAt: { type: 'object', format: 'date-time' },
          lastAccess: { type: 'object', format: 'date-time' },
          url: { type: 'string' },
        },
      },
    },
  },
}



function dump(ob: object|undefined) {
  console.log(JSON.stringify(ob, null, 2))
}

describe('Urls Integration', function () {
  let mapper: DataMapper
  let tableName: string
  let oldTableName: string

  let udb: UrlsDatabase

  // If defined test table is created for intgration test and persisted.
  // Otherwise a temporary table is created/deleted per run.
  const TABLE_NAME_INTEGRATION_TEST = undefined // 'UrlsIntegrationTest'

  const testClientId = 'testClientId'

  this.timeout(60000)

  before(async function () {
    const ddb = createDynamoClient()
    mapper = new DataMapper({ client: ddb })
    const [seconds, nanoseconds] = hrtime()
    tableName = TABLE_NAME_INTEGRATION_TEST || `urls-database-integ-${seconds}-${nanoseconds}-${hostname()}`
    console.log(`Ensuring table exists: ${tableName}`)
    oldTableName = UrlEntry.prototype[DynamoDbTable]
    const clientIdIndexName: string = process.env.INDEX_NAME_CLIENT!
    console.log(`Index GSI name: ${clientIdIndexName}`)
    UrlEntry.prototype[DynamoDbTable] = tableName
    await mapper.ensureTableExists(UrlEntry, {
      readCapacityUnits: 10,
      writeCapacityUnits: 10,
      indexOptions: {
        [clientIdIndexName]: {
            projection: 'all',
            readCapacityUnits: 1,
            type: 'global',
            writeCapacityUnits: 1
        }
      },
    })
    udb = new UrlsDatabase(ddb)
  })
  after(function () {
    if (!TABLE_NAME_INTEGRATION_TEST) {
      console.log(`Removing table: ${tableName}`)
      UrlEntry.prototype[DynamoDbTable] = oldTableName
      return mapper.ensureTableNotExists(UrlEntry)
    }
  })
  beforeEach(function() {
    return udb.deleteAllEntries(testClientId)
  })

  async function addAuto(longUrl: string) {
    const res = await udb.createAuto(testClientId, longUrl)
    expect(res).to.be.jsonSchema(CREATE_SHORTLINK_RESPONSE_SCHEMA)
    return res
  }

   async function addAlias(alias: string, longUrl: string) {
    const res = await udb.createAlias(testClientId, alias, longUrl)
    expect(res).to.be.jsonSchema(CREATE_SHORTLINK_RESPONSE_SCHEMA)
    return res
   }

  it('should create auto', async function () {
    const url = 'https://www.google.com'
    const res = await addAuto(url)
    expect(res).to.include({
      code: 'created',
      msg: 'Generated id',
      url
    })
  })

  it('should create alias', async function () {
    const url = 'https://www.google.com'
    const alias = 'sneaker_sale'
    const res = await addAlias(alias, url)
    expect(res).to.eql({
      code: 'created',
      msg: 'Added alias',
      id: alias,
      url
    })
  })

  it('should add access time', async function () {
    const url = 'https://www.google.com'
    const res = await addAuto(url)
    expect(res).to.not.have.property('lastAccess')

    const res2 = await udb.getById(res.id!)
    expect(res2).to.include({
       id: res.id,
       url: res.url,
       clientId: testClientId
    })
    expect(res2).to.contain.keys('createdAt', 'lastAccess')
  })


  it('should reject second auto', async function () {
    const url = 'https://www.google.com'
    await addAuto(url)
    const res = await udb.createAuto(testClientId, url)
    expect(res).to.be.jsonSchema(CREATE_SHORTLINK_RESPONSE_SCHEMA)
    dump(res)
    expect(res).to.include({
      code: 'created',
      msg: 'Generated id',
      url
    })
  })

  it('should reject second alias', async function () {
    const url = 'https://www.google.com'
    const alias = 'batman'
    await addAlias(alias, url)
    const res = await udb.createAlias(testClientId, alias, url)
    expect(res).to.be.jsonSchema(CREATE_SHORTLINK_RESPONSE_SCHEMA)
    dump(res)
    expect(res).to.include({
      code: 'aliasExists',
      msg: 'Alias already exists',
      id: 'batman',
      url
    })
  })

   it('should get entries', async function() {
    await Promise.all([addAuto('https://www.google.com'), addAuto('https://www.xealth.io')])
    const res = await udb.getEntries(testClientId)
    dump(res)
    expect(res).to.be.jsonSchema(LIST_SHORTLINKS_RESPONSE_SCHEMA)
    expect(res.items.length).to.equal(2)
  })


})
