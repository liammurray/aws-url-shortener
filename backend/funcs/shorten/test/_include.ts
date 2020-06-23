import chai from 'chai'
import chaiJsonSchema from 'chai-json-schema-ajv'
import sinonChai from 'sinon-chai'

chai.use(sinonChai).use(
  chaiJsonSchema.withOptions({
    //verbose: true,
    allErrors: true,
    // Specific to swagger not json-schema spec
    unknownFormats: ['int32'],
  })
)

process.env.AWS_REGION = 'us-west-2'
process.env.SERVICE_NAME = 'UrlShortnerTest'
process.env.TABLE_NAME_URLS = 'UrlsTest'
process.env.INDEX_NAME_CLIENT = 'ClientIdIndex'
