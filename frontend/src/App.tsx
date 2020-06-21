import React from 'react'
import { Layout } from 'antd'
import 'antd/dist/antd.css'

import UrlList from './components/urlList'
import UrlSubmit from './components/urlSubmit'
import UrlsApi from './utils/urlsApi'

const { Header, Content } = Layout
const urlsApi = new UrlsApi()

export default function App(): JSX.Element {
  return (
    <div>
      <Layout>
        <Header heading-color="white">Url Shortener</Header>
        <Content>
          <UrlSubmit urlsApi={urlsApi} />
          <UrlList urlsApi={urlsApi} />
        </Content>
      </Layout>
    </div>
  )
}
