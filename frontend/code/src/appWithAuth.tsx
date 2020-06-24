import React from 'react'
import {
  AmplifyAuthenticator,
  AmplifySignOut,
  AmplifySignIn,
  AmplifySignUp,
} from '@aws-amplify/ui-react'
import App from './app'

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
