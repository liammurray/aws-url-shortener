import Url from 'url-parse'
import { format } from 'date-fns'

export function formatDate(iso: string): string {
  return format(new Date(iso), 'yyyy/MM/dd H:mma')
}

export function makeUrl(url: string, path?: string): Url {
  const out = new Url(url)
  out.set('pathname', path || '')
  return out
}

/**
 * https://u.nod15c.com/path
 */
export function formatUrl(url: string, path?: string): Url {
  return makeUrl(url, path).href
}

/**
 * u.nod15c.com
 */
export function formatUrlNoProto(url: string, path?: string): Url {
  const u = makeUrl(url, path)
  return u.href.slice(u.protocol.length + 2)
}
