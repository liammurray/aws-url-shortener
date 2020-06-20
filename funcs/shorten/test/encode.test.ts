import chai from 'chai'
import { encode, decode } from '../src/encode'
const expect = chai.expect
import 'mocha'

function encDec(val: number, base: number) {
  const encoded = encode(val, base)
  console.log(`${val} encoded ${base}: ${encoded}`)
  const decoded = decode(encoded, base)
  console.log(`${encoded} decoded ${base}: ${decoded}`)
  expect(decoded).to.equal(val)
}
function addTests(vals: number[]): void {

  it(`should encode and decode 62`, function () {
    for (const val of vals) {
      encDec(val, 62)
    }
  })
  it(`should encode and decode 36`, function () {
    for (const val of vals) {
      encDec(val, 36)
    }
  })
}

describe('encode util', function () {
  addTests([0, 1, 63, 2131341, 4 * Math.pow(2, 30)])
})
