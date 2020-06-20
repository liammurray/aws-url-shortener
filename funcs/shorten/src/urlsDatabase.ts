import AWS from 'aws-sdk'
import { logger, envStr } from './util'
import { createDynamoClient } from './awsUtil'
import { encode } from './encode'
import { DataMapper, DynamoDbTable } from '@aws/dynamodb-data-mapper'
import { hashKey, table, attribute } from '@aws/dynamodb-data-mapper-annotations'
// import { MathematicalExpression, FunctionExpression, UpdateExpression } from '@aws/dynamodb-expressions'
import _get from 'lodash.get'
import { URL } from 'url'
//import crypto from 'crypto'

const urlEntriesTableName = envStr('TABLE_NAME_URLS')
const clientIdIndexName = envStr('INDEX_NAME_CLIENT')

// We can use base 36 or 62 (includes uppper case) since URL paths are case sensitive.
// However, lower case looks better and are easier to type.
// The downside is they are less compact.
const ENCODE_BASE = 36 // 62

const MIN_ALIAS_LENGTH = 6
const MAX_ALIAS_LENGTH = 64

// Must be at least MIN_ALIAS_LENGTH
const ID_COUNTER = 'counter'
const INIT_COUNTER_VALUE = 1000
const MAX_URL_LENGTH = 1024
const ALIAS_REGEX = /^\w+$/

function isValidUrl(str: string): boolean {
  if (str.length > MAX_URL_LENGTH) {
    return false
  }
  try {
    const url = new URL(str)
    return ['https:'].includes(url.protocol)
  } catch (err) {
    return false
  }
}

/**
 * Auto-generated short names:
 *
 *  - The short name is generated by converting a monitonically incrementing counter to Base62.
 *  - This keeps auto generated names as short as possible.
 *  - The counter is stored in a special entry with id "counter" (with value stored in url field).
 *
 * Aliases:
 *
 *  - Alias itself is used as short name
 *  - Alias must be at least MIN_ALIAS_LENGTH characters
 *      - 62^5 = 916132832 slots for counter range
 *      - 36^5 =  60466176 slots
 *
 * Partition key:
 *  - The partition key (id) is the short name or alias
 */
@table(urlEntriesTableName)
export class UrlEntry {
  /** Partition key */
  @hashKey()
  id!: string

  /**
   * Time short URL was created
   */
  @attribute({
    defaultProvider: () => new Date(),
    indexKeyConfigurations: {
      [clientIdIndexName]: 'RANGE',
    },
  })
  createdAt!: Date

  /**
   * Time of last access for redirect
   */
  @attribute()
  lastAccess!: Date

  /**
   * The client that created the entry
   */
  @attribute({
    indexKeyConfigurations: {
      [clientIdIndexName]: 'HASH',
    },
  })
  clientId!: string

  /** URL (or counter) */
  @attribute()
  url!: string
}

export type CreateCode = 'created' | 'aliasExists' | 'aliasInvalid' | 'urlInvalid'

export type CreateResult = {
  code: CreateCode
  msg?: string
  id?: string
  url: string
}

export type ListResult = {
  items: UrlEntry[]
}

/**
 * Access layer built on DynamoDb
 */
export class UrlsDatabase {
  private mapper: DataMapper
  private dbc: AWS.DynamoDB.DocumentClient
  constructor(client: AWS.DynamoDB) {
    this.mapper = new DataMapper({ client })
    this.dbc = new AWS.DynamoDB.DocumentClient({ service: client })
  }

  /**
   * Automically increments counter. The counter is stored in a special record.
   * The counter value itself is stored in the "url" field.
   */
  async getNextCounter(): Promise<number> {
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
    const res = await this.dbc
      .update({
        TableName: UrlEntry.prototype[DynamoDbTable],
        Key: { id: ID_COUNTER },
        UpdateExpression: 'SET #val = if_not_exists(#val, :dv) + :incr',
        ExpressionAttributeNames: { '#val': 'url' },
        ExpressionAttributeValues: { ':incr': 1, ':dv': INIT_COUNTER_VALUE },
        ReturnValues: 'UPDATED_NEW',
      })
      .promise()
    const counter = _get(res, 'Attributes.url')
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

  async getNextShortName(): Promise<string> {
    return encode(await this.getNextCounter(), ENCODE_BASE)
  }

  /**
   * Creates a URL entry with a unique auto-generated short name.
   * Returns the short name.
   * Does not check if original URL is unique. You can call getByUrl() first.
   */
  async createAuto(clientId: string, url: string): Promise<CreateResult> {
    if (!isValidUrl(url)) {
      return {
        code: 'urlInvalid',
        msg: 'URL must be valid https URL and less than 1024 characters',
        url,
      }
    }
    const entry = new UrlEntry()
    entry.id = await this.getNextShortName()
    entry.url = url
    entry.clientId = clientId
    logger.info({ entry }, 'Adding auto-generated entry')
    await this.mapper.put(entry)
    return {
      code: 'created',
      msg: 'Generated id',
      id: entry.id,
      url,
    }
  }

  async createAlias(clientId: string, alias: string, url: string): Promise<CreateResult> {
    if (alias.length < MIN_ALIAS_LENGTH || alias.length > MAX_ALIAS_LENGTH) {
      return {
        code: 'aliasInvalid',
        msg: `Alias must be within ${MIN_ALIAS_LENGTH} and ${MAX_ALIAS_LENGTH} characters`,
        id: alias,
        url,
      }
    }

    if (!ALIAS_REGEX.test(alias)) {
      return {
        code: 'aliasInvalid',
        msg: `Alias must contain only letters, numbers or underscores`,
        id: alias,
        url,
      }
    }

    if (!isValidUrl(url)) {
      return {
        code: 'urlInvalid',
        msg: 'URL must be valid https URL and less than 1024 characters',
        url,
      }
    }

    const existing = await this.getById(alias)
    if (existing) {
      return {
        code: 'aliasExists',
        msg: `Alias already exists`,
        id: alias,
        url: existing.url,
      }
    }

    const entry = new UrlEntry()
    entry.id = alias
    entry.clientId = clientId
    entry.url = url
    logger.info({ entry }, 'Adding alias')
    await this.mapper.put(entry)
    return {
      code: 'created',
      msg: 'Added alias',
      id: entry.id,
      url: entry.url,
    }
  }

  /**
   * Looks up url entry by short name or alias
   */
  async getById(id: string): Promise<UrlEntry | undefined> {
    const entry = new UrlEntry()
    entry.id = id
    try {
      //TODO: UpdateItem with ConditionalWrite (to update date if exists and return in one operation)
      const found = await this.mapper.get(entry)
      found.lastAccess = new Date()
      await this.mapper.put(found)
      return found
    } catch (err) {
      // ItemNotFoundException
      logger.info({ err }, 'get')
    }
  }

  async deleteById(id: string): Promise<void> {
    const entry = new UrlEntry()
    entry.id = id
    try {
      await this.mapper.delete(entry)
    } catch (err) {
      logger.info({ err }, 'delete')
    }
  }

  /**
   * Gets entries created with given client id
   *
   */
  async getEntries(clientId: string, limit?: number): Promise<ListResult> {
    const paginator = this.mapper
      .query(
        UrlEntry,
        {
          clientId,
        },
        {
          limit,
          indexName: clientIdIndexName,
        }
      )
      .pages()
    const items: UrlEntry[] = []
    for await (const page of paginator) {
      items.push(...page)
    }
    return {
      items,
    }
  }

  async deleteAllEntries(clientId: string): Promise<number> {
    const paginator = this.mapper
      .query(
        UrlEntry,
        {
          clientId,
        },
        {
          indexName: clientIdIndexName,
        }
      )
      .pages()

    let count
    for await (const page of paginator) {
      console.log(JSON.stringify(page))
      for await (const item of this.mapper.batchDelete(page)) {
        //console.log(`Removed: ${JSON.stringify(item, null, 2)}`)
      }
      count += page.length
    }
    return count
  }
}

let urls: UrlsDatabase

export function getUrlsDatabase(): UrlsDatabase {
  if (!urls) {
    urls = new UrlsDatabase(createDynamoClient())
  }
  return urls
}
