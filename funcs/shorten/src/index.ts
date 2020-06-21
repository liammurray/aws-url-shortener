import { logger } from './util'

import { getUrlsDatabase, CreateResult, ListResult } from './urlsDatabase'
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
  if (out == null || typeof out != 'string') {
    throw new Error(`Parameter: ${key}`)
  }
  return out
}

function getOptStr(ob: Record<string, any>, key: string): string | undefined {
  const out = _get(ob, key)
  if (out != null && typeof out != 'string') {
    throw new Error(`Parameter: ${key}`)
  }
  return out
}

function getOptNumber(ob: Record<string, any>, key: string): number | undefined {
  const val = _get(ob, key)
  if (val != null) {
    return parseInt(val, 10)
  }
}

export function getClientId(event: APIGatewayEvent): string {
  // sub (subject) contains client_id
  return _get(event, 'requestContext.authorizer.claims.sub') || ''
}

/**
 * GET /
 *
 * Query params:
 *   limit
 */
export async function getLinks(event: APIGatewayEvent): Promise<Response> {
  const clientId = getClientId(event)
  const limit = Math.min(getOptNumber(event, 'queryStringParameters.limit') || 10, 25)

  try {
    const db = getUrlsDatabase()
    const res: ListResult = await db.getEntries(clientId, limit)
    return makeResponse(res, HttpStatus.OK)
  } catch (err) {
    return makeResponse(undefined, HttpStatus.INTERNAL_SERVER_ERROR, err)
  }
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
  let alias: string | undefined
  const clientId = getClientId(event)
  try {
    url = getStr(event, 'queryStringParameters.url')
    // Alternative: PUT /<alias>
    alias = getOptStr(event, 'queryStringParameters.alias')
  } catch (err) {
    return makeResponse({ err: err.toString() }, HttpStatus.BAD_REQUEST)
  }

  try {
    const db = getUrlsDatabase()
    let res: CreateResult
    if (alias) {
      res = await db.createAlias(clientId, alias, url)
    } else {
      res = await db.createAuto(clientId, url)
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
 * Returns REDIRECT (302) to mapped URL.
 * Returns NOT_FOUND (404) if ID does not exist.
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
    if (ent?.url) {
      return makeRedirectResponse(ent.url)
    }
    return makeResponse({ id }, HttpStatus.NOT_FOUND)
  } catch (err) {
    // Return 404 for any error (usually means bad ID format)
    return makeResponse({ id }, HttpStatus.NOT_FOUND)
  }
}

type Handler = (event: APIGatewayEvent) => Promise<Response>
type HandlerMap = { [key: string]: Handler }

const rootHandlerMap: HandlerMap = {
  GET: getLinks,
  POST: createShortLink,
}

const pathParamHandlerMap: HandlerMap = {
  GET: redirect,
}

/**
 * Lambda CRUD entry point mapped based on HTTP resource and verb.
 * This allows us to deploy one lambda (simplifies lambda deploy).
 *
 * POST / => create short URL
 * GET  / => list urls for current client
 *
 * GET  /<id> => redirect to actual URL
 */
export async function urlHandler(event: APIGatewayEvent): Promise<Response> {
  let handler: Handler | undefined
  switch (event.resource) {
    case '/':
      handler = rootHandlerMap[event.httpMethod]
      break
    case '/{shortId}':
      handler = pathParamHandlerMap[event.httpMethod]
      break
    default:
      break
  }
  if (handler) {
    return handler(event)
  }
  return makeResponse(undefined, HttpStatus.FORBIDDEN)
}
