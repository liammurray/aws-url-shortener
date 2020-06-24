import Url from 'url-parse'
import { format } from 'date-fns'

export function formatDate(iso: string): string {
  return format(new Date(iso), 'yyyy/MM/dd (h:mm a)')
}

export function makeUrl(url: string, path?: string): Url {
  const out = new Url(url)
  out.set('pathname', path || '')
  return out
}

/**
 * https://u.nod15c.com/path
 */
export function formatUrl(url: string, path?: string): string {
  return makeUrl(url, path).href
}

/**
 * u.nod15c.com
 */
export function formatUrlNoProto(url: string, path?: string): string {
  const u = makeUrl(url, path)
  return u.href.slice(u.protocol.length + 2)
}

export function formatUrlPathOnly(url: string): string {
  const u = new Url(url)
  return `${u.origin}${u.pathname}`
}
