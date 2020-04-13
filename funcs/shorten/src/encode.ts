// [a-z 0–9 A-Z]
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const map = {}
for (let idx = 0; idx < CHARS.length; ++idx) {
  map[CHARS[idx]] = idx
}

export function decodeBase62(encoded: string): number {
  const base = CHARS.length
  let out = 0
  for (const c of encoded) {
    out *= base
    const val = map[c]
    if (val === undefined) {
      throw new Error(`Bad digit ${c} (should be [a-z 0–9 A-Z])`)
    }
    out += val
  }
  return out
}

export function encodeBase62(val: number): string {
  const base = CHARS.length
  const out: string[] = []
  do {
    out.push(CHARS[val % base])
    val = Math.floor(val / base)
  } while (val > 0)
  return out.reverse().join('')
}
