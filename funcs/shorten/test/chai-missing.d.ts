// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare module Chai {
  interface Assertion {
    jsonSchema(any): Assertion
  }
}
