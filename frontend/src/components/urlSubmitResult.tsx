import React from 'react'
import { Result, Button, Tooltip, Typography } from 'antd'
import { toUrlString } from '../utils/strUtils'
import { SmileOutlined, CopyOutlined } from '@ant-design/icons'
import copy from 'copy-to-clipboard'
import { CreateResult } from '../utils/urlsApi'

const { Text } = Typography

type Props = {
  baseUrl: string
  result: CreateResult
}

// export type CreateCode = 'created' | 'aliasExists' | 'aliasInvalid' | 'urlInvalid'

// export type CreateResult = {
//   code: CreateCode
//   msg?: string
//   id?: string
//   url: string
// }

export default class UrlSubmitResult extends React.Component<Props> {
  public static defaultProps: Partial<Props> = {}

  getError(result: CreateResult): JSX.Element {
    return <Result status="error" title="Submission Failed" subTitle={result.msg || result.code} />
  }

  copyLink = () => {
    const id = this.props.result.id
    copy(toUrlString(this.props.baseUrl, id))
  }

  getSuccess(result: CreateResult): JSX.Element {
    const id = this.props.result.id
    const link = id ? toUrlString(this.props.baseUrl, id) : ''

    const extra = (
      <div className="desc">
        <Text
          strong
          style={{
            fontSize: 18,
          }}>
          Your link:
        </Text>
        <Button size="large" type="link" href={link}>
          {link}
        </Button>
        <Tooltip title="Copy Link">
          <Button type="ghost" icon={<CopyOutlined />} onClick={this.copyLink} disabled={!id} />
        </Tooltip>
      </div>
    )

    return (
      <div>
        <Result icon={<SmileOutlined />} extra={extra} />
      </div>
    )
  }

  render(): JSX.Element | null {
    const res = this.props.result
    if (res) {
      return res.code === 'created' ? this.getSuccess(res) : this.getError(res)
    }
    return null
  }
}
