import React from 'react'
import { Layout, Divider } from 'antd'
import './app.less'
import UrlList from './containers/urlList'
import UrlSubmitForm from './containers/urlSubmitForm'
import UrlsApi from './utils/urlsApi'

import './styles.css'

const { Content } = Layout
const urlsApi = new UrlsApi()

export default function App(): JSX.Element {
  return (
    <div className="App">
      <Layout>
        <h1 className="Title">Url Shortener</h1>
        <Content>
          <UrlSubmitForm urlsApi={urlsApi} />
          <UrlList urlsApi={urlsApi} />
        </Content>
      </Layout>
    </div>
  )
}
