import { logger } from './util'

import { encodeBase62, decodeBase62 } from './encode'
import { getUrlsDatabase } from './urls'
import { APIGatewayEvent } from 'aws-lambda'
import _get from 'lodash.get'
import HttpStatus from 'http-status-codes'

logger.info({ env: process.env }, 'Loading function')

function getHeaders(hasBody: boolean, contentType = 'application/json') {
  let headers: { [key: string]: string } = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age = 0',
  }
  if (hasBody) {
    headers = { ...headers, 'Content-Type': 'application/json' }
  }
  return headers
}
/**
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
 */
function makeResponse(body: Object | undefined, statusCode: number = HttpStatus.OK, err?: any) {
  const bod = body ? { body: JSON.stringify(body) } : undefined
  const response = {
    statusCode,
    headers: getHeaders(!!body),
    ...bod,
  }
  logger.info({ response, err: err instanceof Error ? err.toString() : undefined }, 'Response')
  return response
}

function makeRedirectResponse(url: string) {
  const response = {
    statusCode: 302,
    headers: {
      Location: url,
    },
  }
  logger.info({ response }, 'Redirect')
  return response
}

function getStr(ob: Object, key: string): string {
  const out = _get(ob, key)
  if (out == null) {
    throw new Error(`Parameter: ${key}`)
  }
  return out
}

function getOptStr(ob: Object, key: string): string {
  return _get(ob, key)
}

type HandlerMap = { [key: string]: (event: APIGatewayEvent) => Promise<any> }
const handlerMap: HandlerMap = {
  GET: redirect,
  POST: createShortUrlEntry,
}

/**
 * Lambda CRUD entry point
 */
export function urlHandler(event: APIGatewayEvent) {
  const handler = handlerMap[event.httpMethod]
  if (handler) {
    return handler(event)
  }
  return makeResponse(undefined, HttpStatus.FORBIDDEN)
}

export async function createShortUrlEntry(event: APIGatewayEvent) {
  let url, custom
  try {
    // TODO validate url
    url = getStr(event, 'queryStringParameters.url')
    custom = getOptStr(event, 'queryStringParameters.custom')
  } catch (err) {
    return makeResponse({ err: err.toString() }, HttpStatus.BAD_REQUEST)
  }

  try {
    const db = getUrlsDatabase()
    const id = await db.create(url)
    const shortId = encodeBase62(id)
    logger.info({ shortId, id, url }, 'Created URL entry')
    return makeResponse({ shortId: shortId }, HttpStatus.OK)
  } catch (err) {
    return makeResponse(undefined, HttpStatus.INTERNAL_SERVER_ERROR, err)
  }
}

export async function redirect(event: APIGatewayEvent) {
  logger.info(event, 'redirect')
  let hash
  try {
    hash = getStr(event, 'pathParameters.shortId')
  } catch (err) {
    return makeResponse({ err: err.toString() }, HttpStatus.BAD_REQUEST)
  }
  try {
    const db = getUrlsDatabase()
    logger.info({ shortId: hash }, 'Decoding short id')
    let id
    try {
      id = decodeBase62(hash)
    } catch (err) {
      return makeResponse({}, HttpStatus.NOT_FOUND, err)
    }
    const entry = await db.get(id)
    if (entry && entry.url) {
      return makeRedirectResponse(entry.url)
    }
    return makeResponse(undefined, HttpStatus.NOT_FOUND)
  } catch (err) {
    return makeResponse({}, HttpStatus.INTERNAL_SERVER_ERROR, err)
  }
}
