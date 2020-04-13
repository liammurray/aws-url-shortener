import chai from 'chai'
import { encodeBase62, decodeBase62 } from '../src/encode'
const expect = chai.expect
import 'mocha'

function addTest(val: number): void {
  it(`should encode and decode ${val}`, function () {
    const encoded = encodeBase62(val)
    console.log(`${val} encoded: ${encoded}`)
    const decoded = decodeBase62(encoded)
    console.log(`${encoded} decoded: ${decoded}`)
    expect(decoded).to.equal(val)
  })
}

describe('encode util', function () {
  const tests = [0, 1, 63, 2131341, 4 * Math.pow(2, 30)]
  for (const t of tests) {
    addTest(t)
  }
})
