import React from 'react'
import { Button, Tooltip, Input } from 'antd'
import { toUrlString } from '../utils/strUtils'
import UrlSubmitResult from './urlSubmitResult'
import UrlsApi, { CreateResult, MAX_URL_LENGTH } from '../utils/urlsApi'

function isValidUrl(str: string): boolean {
  if (str.length > MAX_URL_LENGTH) {
    return false
  }
  try {
    const url = new URL(str)
    return ['https:'].includes(url.protocol) && url.host.length > 0
  } catch (err) {
    return false
  }
}

type Props = {
  urlsApi: UrlsApi
}

type State = {
  loading: boolean
  result: CreateResult | undefined
  alias: string
  url: string
}

export default class UrlSubmit extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {}

  public state: State = {
    loading: false,
    result: undefined,
    alias: '',
    url: '',
  }

  submit = async () => {
    this.setState({ loading: true, result: undefined })
    try {
      const result = await this.props.urlsApi.createShortLink(this.state.url, this.state.alias)
      console.log(JSON.stringify(result, null, 2))
      this.setState({
        loading: false,
        result,
        url: '',
        alias: '',
      })
    } catch (err) {
      console.log(err)
      this.setState({
        loading: false,
        result: undefined,
        url: '',
        alias: '',
      })
    }
  }

  onChangeUrl = event => {
    this.setState({ url: event.target.value })
  }

  onChangeAlias = event => {
    this.setState({ alias: event.target.value })
  }

  render() {
    const id = this.state.result?.id
    const link = id ? toUrlString(this.props.urlsApi.baseUrl, id) : ''

    const isUrlValid = isValidUrl(this.state.url)

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Input
            addonBefore={`${this.props.urlsApi.baseUrl}/`}
            placeholder="Enter optional alias"
            onChange={this.onChangeAlias}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input placeholder="Enter URL for redirect" onChange={this.onChangeUrl} />
        </div>
        <div>
          <Tooltip title="Submit">
            <Button
              type="primary"
              onClick={this.submit}
              loading={this.state.loading}
              disabled={!isUrlValid}>
              Submit
            </Button>
          </Tooltip>
        </div>

        <UrlSubmitResult baseUrl={this.props.urlsApi.baseUrl} result={this.state.result} />
      </div>
    )
  }
}
