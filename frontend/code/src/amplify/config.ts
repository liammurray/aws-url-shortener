const config = {
  Auth: {
    region: 'us-west-2',
    userPoolId: 'us-west-2_lbHD71DMI',
    userPoolWebClientId: '77eqdlmpsb8ip35f4rebdnltsi',
    identityPoolId: 'arn:aws:cognito-idp:us-west-2:958019638877:userpool/us-west-2_lbHD71DMI',
    authenticationFlowType: 'USER_SRP_AUTH',
    mandatorySignIn: false,
  },
  API: {
    endpoints: [
      {
        name: 'UrlShortenerService',
        endpoint: 'https://u.nod15c.com',
        region: 'us-west-2',
      },
    ],
  },
}
export default config
