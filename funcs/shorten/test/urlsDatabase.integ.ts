import { UrlsDatabase, UrlEntry } from '../src/urlsDatabase'
import { hostname } from 'os'
import { hrtime } from 'process'
import { createDynamoClient } from '../src/awsUtil'
import { DataMapper, DynamoDbTable } from '@aws/dynamodb-data-mapper'
import { expect } from 'chai'

describe('Urls Integration', function () {
  let mapper: DataMapper
  let tableName: string
  let oldTableName: string

  let udb: UrlsDatabase

  this.timeout(60000)

  before(async function () {
    const ddb = createDynamoClient()
    mapper = new DataMapper({ client: ddb })
    const [seconds, nanoseconds] = hrtime()
    tableName = `urls-database-integ-${seconds}-${nanoseconds}-${hostname()}`
    console.log(`Creating table: ${tableName}`)
    oldTableName = UrlEntry.prototype[DynamoDbTable]
    UrlEntry.prototype[DynamoDbTable] = tableName
    await mapper.ensureTableExists(UrlEntry, {
      readCapacityUnits: 10,
      writeCapacityUnits: 10,
    })
    udb = new UrlsDatabase(ddb)
  })
  after(function () {
    console.log(`Removing table: ${tableName}`)
    UrlEntry.prototype[DynamoDbTable] = oldTableName
    return mapper.ensureTableNotExists(UrlEntry)
  })
  it('should create auto', async function () {
    const longUrl = 'https://www.google.com'
    const res = await udb.createAuto(longUrl)
    console.log(JSON.stringify(res, null, 2))
    const expected = {
      code: 'created',
      msg: 'Generated id',
      id: 'G9',
    }
    expect(res).to.eql(expected)
  })
  it('should create alias', async function () {
    const longUrl = 'https://www.google.com'
    const alias = 'sneaker_sale'
    const res = await udb.createAlias(alias, longUrl)
    console.log(JSON.stringify(res, null, 2))
    const expected = {
      code: 'created',
      msg: 'Added alias',
      id: 'sneaker_sale',
    }
    expect(res).to.eql(expected)
  })
})
