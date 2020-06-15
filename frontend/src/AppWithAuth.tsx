import Amplify from 'aws-amplify'

import {
  AmplifyAuthenticator,
  AmplifySignOut,
  AmplifySignIn,
  AmplifySignUp,
} from '@aws-amplify/ui-react'
import React from 'react'
import config from './Amplify/config'
import App from './App'

Amplify.configure(config)

// const isAuthenticated = () => Amplify.Auth.user !== null

export function filterUndef<T>(ts: (T | undefined)[]): T[] {
  return ts.filter((t: T | undefined): t is T => !!t)
}

// Key in config
const URLS_API_NAME = 'UrlShortenerService'

interface State {
  shortId: string | undefined
  url: string | undefined
}

class AppWithAuth extends React.Component<{}, State> {
  //public static defaultProps: Partial<Props> = {}

  public state: State = {
    shortId: undefined,
    url: undefined,
  }

  /**
   * Example: list objects using IAM credentials for authenticated user
   */
  // public async getObjects(bucket: string) {
  //   // essentialCredentials() strips out unneeded junk
  //   const creds = Amplify.Auth.essentialCredentials(await Amplify.Auth.currentUserCredentials())
  //   console.log(JSON.stringify(creds, undefined, 2))

  //   const s3 = new AWS.S3({
  //     apiVersion: '2013-04-01',
  //     region: 'us-west-2',
  //     credentials: creds,
  //   })

  //   let params: AWS.S3.ListObjectsV2Request = {
  //     Bucket: bucket,
  //     MaxKeys: 20,
  //     Prefix: '',
  //     Delimiter: '/',
  //   }
  //   const objects: string[] = []
  //   while (true) {
  //     console.log(JSON.stringify(params, undefined, 2))
  //     const res = await s3.listObjectsV2(params).promise()
  //     console.log(JSON.stringify(res, undefined, 2))
  //     // These are "diretories"
  //     const more = (res.CommonPrefixes || []).map(item => item.Prefix)
  //     objects.push(...filterUndef(more))
  //     if (!res.IsTruncated) {
  //       break
  //     }
  //     params = {
  //       ...params,
  //       ContinuationToken: res.NextContinuationToken,
  //     }
  //   }
  //   return objects
  // }

  public async generateShortUrl(longUrl: string) {
    const session = await Amplify.Auth.currentSession()
    const request = {
      queryStringParameters: {
        url: longUrl,
      },
      body: {},
      headers: {
        // If no auth header call will be signed using currentUserCredentials
        Authorization: session.idToken.jwtToken,
        'Content-Type': 'application/json',
      },
    }
    return Amplify.API.post(URLS_API_NAME, '/', request)
  }

  public onClickGenerate = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const url = 'https://www.google.com'
    const res = await this.generateShortUrl(url)
    this.setState({ shortId: res.shortId, url })
  }

  // https://docs.amplify.aws/ui/auth/authenticator/q/framework/react
  public render() {
    return (
      <div>
        <AmplifyAuthenticator>
          <AmplifySignIn usernameAlias="email" slot="sign-in" />
          <AmplifySignUp
            usernameAlias="email"
            slot="sign-up"
            formFields={[{ type: 'email' }, { type: 'password' }]}></AmplifySignUp>
          <App />
          <text>URL: {this.state.url}</text>
          <text>ID: {this.state.shortId}</text>
          <button id="request" className="btn btn-primary" onClick={this.onClickGenerate}>
            Generate
          </button>
          <AmplifySignOut />
        </AmplifyAuthenticator>
      </div>
    )
  }
}

export default AppWithAuth
