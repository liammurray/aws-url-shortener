// 0–9 a-z [A-Z]
const CHARS36 = '0123456789abcdefghijklmnopqrstuvwxyz'
const DIGITS = `${CHARS36}ABCDEFGHIJKLMNOPQRSTUVWXYZ`

const map = {}
for (let idx = 0; idx < DIGITS.length; ++idx) {
  map[DIGITS[idx]] = idx
}

export function decode(encoded: string, base: number): number {
  if (base > DIGITS.length) {
    throw new Error(`Max base supported is ${DIGITS.length}`)
  }
  let out = 0
  for (const c of encoded) {
    out *= base
    const val = map[c]
    if (val === undefined) {
      throw new Error(`Bad digit ${c} (should be [0–9 a-z A-Z])`)
    }
    out += val
  }
  return out
}

export function encode(val: number, base: number): string {
  if (base > DIGITS.length) {
    throw new Error(`Max base supported is ${DIGITS.length}`)
  }
  const out: string[] = []
  do {
    out.push(DIGITS[val % base])
    val = Math.floor(val / base)
  } while (val > 0)
  return out.reverse().join('')
}
