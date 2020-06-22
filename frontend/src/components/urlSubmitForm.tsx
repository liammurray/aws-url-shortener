import React from 'react'
import { Button, Tooltip, Input, Divider } from 'antd'
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

/**
 * The form where URL is pasted/entered. Also supports an alias.
 *
 * Controlled component (stores state of dumb components such as input fields)
 */
export default class UrlSubmitForm extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {}

  public state: State = {
    loading: false,
    result: undefined,
    alias: '',
    url: '',
  }

  submit = async () => {
    this.setState({ loading: true, result: undefined })

    const result = await this.props.urlsApi.createShortLink(this.state.url, this.state.alias)
    console.log(JSON.stringify(result, null, 2))
    this.setState({
      loading: false,
      result,
      url: '',
      alias: '',
    })
  }

  onChangeUrl = event => {
    this.setState({ url: event.target.value })
    event.preventDefault()
  }

  onChangeAlias = event => {
    this.setState({ alias: event.target.value })
    event.preventDefault()
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
            value={this.state.alias}
            onChange={this.onChangeAlias}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Enter URL for redirect"
            value={this.state.url}
            onChange={this.onChangeUrl}
          />
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
        <Divider />
        <UrlSubmitResult baseUrl={this.props.urlsApi.baseUrl} result={this.state.result} />
      </div>
    )
  }
}
