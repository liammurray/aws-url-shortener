import React from 'react'
import { Layout } from 'antd'
import './app.less'
import UrlList from './components/urlList'
import UrlSubmitForm from './components/urlSubmitForm'
import UrlsApi from './utils/urlsApi'

import './styles.css'

const { Content } = Layout
const urlsApi = new UrlsApi()

export default function App(): JSX.Element {
  return (
    <div className="App">
      <Layout>
        <h1>Nod15c Url Shortener</h1>
        <Content>
          <UrlSubmitForm urlsApi={urlsApi} />
          <UrlList urlsApi={urlsApi} />
        </Content>
      </Layout>
    </div>
  )
}
