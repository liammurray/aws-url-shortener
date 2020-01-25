"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const encode_1 = require("./encode");
const urls_1 = require("./urls");
const lodash_get_1 = __importDefault(require("lodash.get"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
util_1.logger.info({ env: process.env }, 'Loading function');
function getHeaders(hasBody, contentType = 'application/json') {
    let headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age = 0',
    };
    if (hasBody) {
        headers = { ...headers, 'Content-Type': 'application/json' };
    }
    return headers;
}
/**
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
 */
function makeResponse(body, statusCode = http_status_codes_1.default.OK, err) {
    const bod = body ? { body: JSON.stringify(body) } : undefined;
    const response = {
        statusCode,
        headers: getHeaders(!!body),
        ...bod,
    };
    util_1.logger.info({ response, err: err instanceof Error ? err.toString() : undefined }, 'Response');
    return response;
}
function makeRedirectResponse(url) {
    const response = {
        statusCode: 302,
        headers: {
            Location: url,
        },
    };
    util_1.logger.info({ response }, 'Redirect');
    return response;
}
function getStr(ob, key) {
    const out = lodash_get_1.default(ob, key);
    if (out == null) {
        throw new Error(`Parameter: ${key}`);
    }
    return out;
}
function getOptStr(ob, key) {
    return lodash_get_1.default(ob, key);
}
const handlerMap = {
    GET: redirect,
    POST: createShortUrlEntry,
};
/**
 * Lambda CRUD entry point
 */
function urlHandler(event) {
    const handler = handlerMap[event.httpMethod];
    if (handler) {
        return handler(event);
    }
    return makeResponse(undefined, http_status_codes_1.default.FORBIDDEN);
}
exports.urlHandler = urlHandler;
async function createShortUrlEntry(event) {
    let url, custom;
    try {
        // TODO validate url
        url = getStr(event, 'queryStringParameters.url');
        custom = getOptStr(event, 'queryStringParameters.custom');
    }
    catch (err) {
        return makeResponse({ err: err.toString() }, http_status_codes_1.default.BAD_REQUEST);
    }
    try {
        const db = urls_1.getUrlsDatabase();
        const id = await db.create(url);
        const shortId = encode_1.encodeBase62(id);
        util_1.logger.info({ shortId, id, url }, 'Created URL entry');
        return makeResponse({ shortId: shortId }, http_status_codes_1.default.OK);
    }
    catch (err) {
        return makeResponse(undefined, http_status_codes_1.default.INTERNAL_SERVER_ERROR, err);
    }
}
exports.createShortUrlEntry = createShortUrlEntry;
async function redirect(event) {
    util_1.logger.info(event, 'redirect');
    let hash;
    try {
        hash = getStr(event, 'pathParameters.shortId');
    }
    catch (err) {
        return makeResponse({ err: err.toString() }, http_status_codes_1.default.BAD_REQUEST);
    }
    try {
        const db = urls_1.getUrlsDatabase();
        util_1.logger.info({ shortId: hash }, 'Decoding short id');
        let id;
        try {
            id = encode_1.decodeBase62(hash);
        }
        catch (err) {
            return makeResponse({}, http_status_codes_1.default.NOT_FOUND, err);
        }
        const entry = await db.get(id);
        if (entry && entry.url) {
            return makeRedirectResponse(entry.url);
        }
        return makeResponse(undefined, http_status_codes_1.default.NOT_FOUND);
    }
    catch (err) {
        return makeResponse({}, http_status_codes_1.default.INTERNAL_SERVER_ERROR, err);
    }
}
exports.redirect = redirect;
//# sourceMappingURL=index.js.map