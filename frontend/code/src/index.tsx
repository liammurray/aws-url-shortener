import React from 'react'
import ReactDOM from 'react-dom'
import * as serviceWorker from './serviceWorker'
import AppWithAuth from './appWithAuth'
import Amplify from 'aws-amplify'
import config from './amplify/config'

// import Amplify, * as AmplifyModules from 'aws-amplify';
Amplify.configure(config)

ReactDOM.render(
  <React.StrictMode>
    <AppWithAuth />
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
