import { logger } from './util'

import { getUrlsDatabase, CreateResult } from './urlsDatabase'
import { APIGatewayEvent } from 'aws-lambda'
import _get from 'lodash.get'
import HttpStatus from 'http-status-codes'

logger.info({ env: process.env }, 'Loading function')

type Headers = { [key: string]: string }
type Body = { [key: string]: any }
type Response = { [key: string]: any }

function getHeaders(hasBody: boolean, _contentType = 'application/json'): Headers {
  let headers: Headers = {
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
function makeResponse(
  body: Body | undefined,
  statusCode: number = HttpStatus.OK,
  err?: any
): Response {
  const bod = body ? { body: JSON.stringify(body) } : undefined
  const response = {
    statusCode,
    headers: getHeaders(!!body),
    ...bod,
  }
  logger.info({ response, err: err instanceof Error ? err.toString() : undefined }, 'Response')
  return response
}

function makeRedirectResponse(url: string): Response {
  const response = {
    statusCode: 302,
    headers: {
      Location: url,
    },
  }
  logger.info({ response }, 'Redirect')
  return response
}

function getStr(ob: Record<string, any>, key: string): string {
  const out = _get(ob, key)
  if (out == null) {
    throw new Error(`Parameter: ${key}`)
  }
  return out
}

function getOptStr(ob: Record<string, any>, key: string): string {
  return _get(ob, key)
}

export function getClientId(event: APIGatewayEvent): string {
  // Locally we don't get this so use 'anon' (sub is same as client_id)
  return _get(event, 'requestContext.authorizer.claims.sub') || 'anon'
}

export const CREATE_SHORTLINK_RESPONSE_SCHEMA = {
  $schema: 'http://json-schema.org/draft-06/schema',
  type: 'object',
  required: ['shortId', 'code'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    msg: { type: 'string' },
    code: { type: 'string', enum: ['created', 'aliasExists', 'aliasInvalid'] },
  },
}

/**
 * POST /
 *
 * Query params:
 *  url: url to link to
 *  alias: alias to map to
 *
 * Creates short URL entry in database and returns short URL
 */
export async function createShortLink(event: APIGatewayEvent): Promise<Response> {
  let url: string
  let alias: string

  try {
    url = getStr(event, 'queryStringParameters.url')
    alias = getOptStr(event, 'queryStringParameters.alias')
  } catch (err) {
    return makeResponse({ err: err.toString() }, HttpStatus.BAD_REQUEST)
  }

  try {
    const db = getUrlsDatabase()
    let res: CreateResult
    if (alias) {
      res = await db.createAlias(alias, url)
    } else {
      res = await db.createAuto(url)
    }
    logger.info(res, 'Created entry')
    return makeResponse(res, HttpStatus.OK)
  } catch (err) {
    return makeResponse(undefined, HttpStatus.INTERNAL_SERVER_ERROR, err)
  }
}

/**
 * GET /:{id}
 *
 * Returns HTTP 302 redriect to real URL.
 */
export async function redirect(event: APIGatewayEvent): Promise<Response> {
  logger.info(event, 'redirect')
  let id
  try {
    id = getStr(event, 'pathParameters.shortId')
  } catch (err) {
    return makeResponse({ err: err.toString() }, HttpStatus.BAD_REQUEST)
  }
  try {
    const db = getUrlsDatabase()
    const ent = await db.getById(id)
    if (!ent || !ent.url) {
      return makeResponse({ id }, HttpStatus.NOT_FOUND)
    }
    return makeRedirectResponse(ent.url)
  } catch (err) {
    return makeResponse({}, HttpStatus.INTERNAL_SERVER_ERROR, err)
  }
}

type HandlerMap = { [key: string]: (event: APIGatewayEvent) => Promise<Response> }
const handlerMap: HandlerMap = {
  GET: redirect,
  POST: createShortLink,
}

/**
 * Lambda CRUD entry point mapped based on HTTP verb
 *
 * POST / => create short URL
 *
 * GET  /<id> => redirect to actual URL
 */
export async function urlHandler(event: APIGatewayEvent): Promise<Response> {
  const handler = handlerMap[event.httpMethod]
  if (handler) {
    return handler(event)
  }
  return makeResponse(undefined, HttpStatus.FORBIDDEN)
}
