import React from 'react'
import { Button, Tooltip, Input, Space } from 'antd'
import { formatUrlNoProto } from '../utils/strUtils'
import UrlSubmitResult from '../components/urlSubmitResult'
import UrlsApi, { CreateResult, isValidUrl, MAX_URL_LENGTH } from '../utils/urlsApi'

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
    if (result.code == 'created') {
      this.setState({
        loading: false,
        result,
        url: '',
        alias: '',
      })
    } else {
      // Don't clear if error
      this.setState({ loading: false, result })
    }
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
    const shortPrefix = `${formatUrlNoProto(this.props.urlsApi.baseUrl)}/`
    const isUrlValid = isValidUrl(this.state.url)

    return (
      <Space direction="vertical" className="UrlSubmitForm">
        <Input
          addonBefore={shortPrefix}
          placeholder="Alias (optional)"
          value={this.state.alias}
          onChange={this.onChangeAlias}
        />

        <Input placeholder="Target URL" value={this.state.url} onChange={this.onChangeUrl} />

        <Tooltip title="Submit">
          <Button
            type="primary"
            onClick={this.submit}
            loading={this.state.loading}
            disabled={!isUrlValid}>
            Shorten
          </Button>
        </Tooltip>

        <UrlSubmitResult baseUrl={this.props.urlsApi.baseUrl} result={this.state.result} />
      </Space>
    )
  }
}
