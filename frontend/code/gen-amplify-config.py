#!/usr/bin/env python3
#
# See outputs from CDK
#
import boto3
import jinja2


cf = boto3.resource('cloudformation')

def get_outputs(name):
  print("Fetching CFN outputs for {}".format(name))
  stack = cf.Stack(name)
  return dict((o['OutputKey'], o['OutputValue']) for o in stack.outputs)

vals = {
  'name': 'UrlShortenerService',
  'region': 'us-west-2'
}

cfo = get_outputs('urls-cognito-dev')
vals['userPoolId'] = cfo['UserPoolId']
vals['clientId'] = cfo['ClientIdApiClient']
vals['identityPoolId'] = cfo['UrlShortnerIdentityPoolId']

ao = get_outputs('urls-api-dev')
vals['endpoint'] = "https://{}".format(ao['DomainName'])



template='''
const config = {
  Auth: {
    region: '{{ o['region'] }}',
    userPoolId: '{{ o['userPoolId'] }}',
    userPoolWebClientId: '{{ o['clientId'] }}',
    identityPoolId: '{{ o['identityPoolId'] }}',
    authenticationFlowType: 'USER_SRP_AUTH',
    mandatorySignIn: false,
  },
  API: {
    endpoints: [
      {
        name: '{{ o['name'] }}',
        endpoint: '{{ o['endpoint'] }}',
        region: '{{ o['region'] }}',
      },
    ],
  },
}
export default config
'''

config = jinja2.Template(template).render({
    'o': vals
})

output='./src/Amplify/config.ts'
print(">> Writing {}".format(output))
with open(output, 'wt') as f:
    f.write(config)

