import { Auth, API } from 'aws-amplify'

export const MIN_ALIAS_LENGTH = 6
export const MAX_ALIAS_LENGTH = 64
export const MAX_URL_LENGTH = 1024
export const ALIAS_REGEX = /^[\w-]+$/

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

// TODO: recreate api client when token changes, store as class member
async function getTokenForCurrentUser() {
  const user = await Auth.currentAuthenticatedUser()
  return user.signInUserSession.idToken.jwtToken
}

/**
 * API client for access to backend URLs API, using Amplify to call API
 *
 * An alternative approach:
 *   Generate typescript client
 *   Add amplify headers
 * That way types such as UrlEntry would come from the generated client and
 * we can version client tied to API.
 *
 */
export default class UrlsApi {
  public readonly baseUrl

  constructor(private readonly apiName = 'UrlShortenerService') {
    this.baseUrl = 'https://u.nod15c.com'
  }

  public async createShortLink(url: string, alias?: string): Promise<CreateResult> {
    const token = await getTokenForCurrentUser()
    console.log(`Token: ${JSON.stringify(token, null, 2)}`)

    const request = {
      queryStringParameters: {
        url,
        alias,
      },
      body: {},
      headers: {
        // If no auth header call will be signed using currentUserCredentials
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }
    return API.post(this.apiName, '/', request)
  }

  public async getUrls(): Promise<UrlEntry[]> {
    const token = await getTokenForCurrentUser()

    const request = {
      queryStringParameters: {
        limit: 5,
      },
      body: {},
      headers: {
        // If no auth header call will be signed using currentUserCredentials
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }
    const res = await API.get(this.apiName, '/', request)
    return res.items
  }
}
