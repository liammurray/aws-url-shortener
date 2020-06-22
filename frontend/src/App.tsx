import React from 'react'
import { Layout } from 'antd'
import 'antd/dist/antd.css'

import UrlList from './components/urlList'
import UrlSubmit from './components/urlSubmit'
import UrlsApi from './utils/urlsApi'

const { Content } = Layout
const urlsApi = new UrlsApi()

export default function App(): JSX.Element {
  return (
    <div className="App">
      <Layout>
        <h1>Nod15c Url Shortener</h1>
        <Content>
          <UrlSubmit urlsApi={urlsApi} />
          <UrlList urlsApi={urlsApi} />
        </Content>
      </Layout>
    </div>
  )
}
