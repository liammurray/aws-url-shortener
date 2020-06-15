import AWS from 'aws-sdk'
import { logger, envStr } from './util'
import { createDynamoClient } from './awsUtil'
import { DataMapper } from '@aws/dynamodb-data-mapper'
import { hashKey, table, attribute } from '@aws/dynamodb-data-mapper-annotations'
// import { MathematicalExpression, FunctionExpression, UpdateExpression } from '@aws/dynamodb-expressions'
import _get from 'lodash.get'

const urlEntriesTableName = envStr('TABLE_NAME_URL_ENTRIES')

@table(urlEntriesTableName)
export class UrlEntry {
  @hashKey()
  id!: number

  @attribute({ defaultProvider: () => new Date() })
  createdAt!: Date

  @attribute()
  url!: string
}

// We use id 0 as counter (and url stores counter)
// Update item performs upsert
const ID_COUNTER = 0
const INIT_COUNTER_VALUE = 1000

/**
 * Access layer built on DynamoDb
 */
export default class Urls {
  private mapper: DataMapper
  private dbc: AWS.DynamoDB.DocumentClient
  constructor(client: AWS.DynamoDB) {
    this.mapper = new DataMapper({ client })
    this.dbc = new AWS.DynamoDB.DocumentClient({ service: client })
  }

  async getNextCounter(): Promise<number> {
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
    const res = await this.dbc
      .update({
        TableName: urlEntriesTableName,
        Key: { id: ID_COUNTER },
        UpdateExpression: 'SET #val = if_not_exists(#val, :dv) + :incr',
        ExpressionAttributeNames: { '#val': 'url' },
        ExpressionAttributeValues: { ':incr': 1, ':dv': INIT_COUNTER_VALUE },
        ReturnValues: 'UPDATED_NEW',
      })
      .promise()
    const counter = _get(res, 'Attributes.url')
    if (!counter) {
      throw new Error('Failed to get counter')
    }
    return parseInt(counter)
  }

  // Seems support for func expression as argument not supported in 0.7.3 (not published yet)
  // async getNextCounterX(): Promise<number> {
  //   const expr = new UpdateExpression()
  //   const lhs = new FunctionExpression('if_not_exists', INIT_COUNTER_VALUE)
  //   expr.set('url', new MathematicalExpression(lhs, '+', 1))
  //   const entry = await this.mapper.executeUpdateExpression(expr, { id: ID_COUNTER }, UrlEntry)
  //   return parseInt(entry.url)
  // }

  /**
   * Creates a URL entry with unique ID. Returns ID.
   * Does not check if URL is unique.
   */
  async create(url: string): Promise<number> {
    logger.info({ url }, 'create')

    const entry = new UrlEntry()
    entry.id = await this.getNextCounter()
    entry.url = url
    logger.info({ entry }, 'Adding entry')
    await this.mapper.put(entry)
    return entry.id
  }

  /**
   * Looks up url entry by id
   */
  async get(id: number): Promise<UrlEntry | undefined> {
    const entry = new UrlEntry()
    entry.id = id
    try {
      return await this.mapper.get(entry)
    } catch (err) {
      // ItemNotFoundException
      logger.info({ err }, 'get')
    }
  }

  async delete(id: number): Promise<void> {
    const entry = new UrlEntry()
    entry.id = id
    try {
      await this.mapper.delete(entry)
    } catch (err) {
      logger.info({ err }, 'delete')
    }
  }
}

let urls: Urls

export function getUrlsDatabase(): Urls {
  if (!urls) {
    urls = new Urls(createDynamoClient())
  }
  return urls
}
