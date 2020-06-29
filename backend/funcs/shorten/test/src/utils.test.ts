import chai from 'chai'
import { isValidAlias } from '../../src/urlsDatabase'
const expect = chai.expect
import 'mocha'


describe('valid aliases', function () {
  const valid = [
    'foobar',
    'foobarFoobar',
    'foobar-foobar',
    'foobar_foobar',
    'foo123-foo456_foo',
  ]

  const invalid = [
    'foo',
    'foobarFoobar=',
    'foobar.foobar',
  ]

  for (const alias of valid) {
    it(`should be valid alias: ${alias}`, function () {
      expect(isValidAlias(alias)).to.be.true
    })
  }
  for (const alias of invalid) {
    it(`should be invalid alias: ${alias}`, function () {
      expect(isValidAlias(alias)).to.be.false
    })
  }
})
