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

class AppWithAuth extends React.Component {
  // https://docs.amplify.aws/ui/auth/authenticator/q/framework/react
  public render(): JSX.Element {
    return (
      <div>
        <AmplifyAuthenticator>
          <AmplifySignIn usernameAlias="email" slot="sign-in" />
          <AmplifySignUp
            usernameAlias="email"
            slot="sign-up"
            formFields={[{ type: 'email' }, { type: 'password' }]}></AmplifySignUp>
          <App />
          <AmplifySignOut />
        </AmplifyAuthenticator>
      </div>
    )
  }
}

export default AppWithAuth
