import React from 'react'
import { Layout } from 'antd'
import './app.less'
import './styles.css'
import UrlTable from './containers/urlTable'
import UrlSubmitForm from './containers/urlSubmitForm'
import UrlsApi from './utils/urlsApi'

const { Content } = Layout
const urlsApi = new UrlsApi()

export default function App(): JSX.Element {
  return (
    <div className="App">
      <Layout>
        <h1 className="Title">Url Shortener</h1>
        <Content>
          <UrlSubmitForm urlsApi={urlsApi} />
          <UrlTable urlsApi={urlsApi} />
        </Content>
      </Layout>
    </div>
  )
}
