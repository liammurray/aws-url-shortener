import Amplify from 'aws-amplify'

export const MIN_ALIAS_LENGTH = 6
export const MAX_ALIAS_LENGTH = 64
export const MAX_URL_LENGTH = 1024
export const ALIAS_REGEX = /^\w+$/

export type CreateCode = 'created' | 'aliasExists' | 'aliasInvalid' | 'urlInvalid'

export type CreateResult = {
  code: CreateCode
  msg?: string
  id?: string
  url: string
}

export type UrlEntry = {
  id: string
  createdAt: string
  lastAccess: string
  accessCount: number
  clientId: string
  url: string
}

const httpUrlSchemeRegex = /^https?:\/\/.+/

// Very basic validation
export function isValidUrl(str: string): boolean {
  if (str.length > MAX_URL_LENGTH) {
    return false
  }

  return httpUrlSchemeRegex.test(str)
}

export default class UrlsApi {
  public readonly baseUrl

  constructor(private readonly apiName = 'UrlShortenerService') {
    this.baseUrl = 'https://u.nod15c.com'
  }

  public async createShortLink(url: string, alias?: string): Promise<CreateResult> {
    const session = await Amplify.Auth.currentSession()
    const request = {
      queryStringParameters: {
        url,
        alias,
      },
      body: {},
      headers: {
        // If no auth header call will be signed using currentUserCredentials
        Authorization: session.idToken.jwtToken,
        'Content-Type': 'application/json',
      },
    }
    return Amplify.API.post(this.apiName, '/', request)
  }

  public async getUrls(): Promise<UrlEntry[]> {
    const session = await Amplify.Auth.currentSession()
    const request = {
      queryStringParameters: {
        limit: 5,
      },
      body: {},
      headers: {
        // If no auth header call will be signed using currentUserCredentials
        Authorization: session.idToken.jwtToken,
        'Content-Type': 'application/json',
      },
    }
    const res = await Amplify.API.get(this.apiName, '/', request)
    return res.items
  }
}
