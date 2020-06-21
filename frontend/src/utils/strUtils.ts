import Url from 'url-parse'
import { format } from 'date-fns'

export function formatDate(iso: string): string {
  return format(new Date(iso), 'yyyy/MM/dd H:mma')
}

export function toUrl(url, path): Url {
  const out = new Url(url)
  out.set('pathname', path)
  return out
}

export function toUrlString(url, path): Url {
  return toUrl(url, path).href
}
