import React from 'react'
import { Result, Button, Tooltip } from 'antd'
import { formatUrlNoProto, formatUrl } from '../utils/strUtils'
import { SmileOutlined, CopyOutlined } from '@ant-design/icons'
import copy from 'copy-to-clipboard'
import { CreateResult } from '../utils/urlsApi'

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

const ErrorResult = (result: CreateResult): JSX.Element => {
  return <Result status="error" title="Submission Failed" subTitle={result.msg || result.code} />
}

const SuccessResult = (baseUrl, result, copyLink): JSX.Element => {
  const id = result.id
  const link = formatUrl(baseUrl, id)
  const displayLink = formatUrlNoProto(baseUrl, id)

  const extra = (
    <div className="Result">
      <Button size="large" type="link" href={link}>
        {displayLink}
      </Button>
      <Tooltip title="Copy Link">
        <Button type="ghost" icon={<CopyOutlined />} onClick={copyLink} disabled={!id} />
      </Tooltip>
    </div>
  )

  return (
    <div>
      <Result icon={<SmileOutlined />} extra={extra} />
    </div>
  )
}

export default class UrlSubmitResult extends React.Component<Props> {
  public static defaultProps: Partial<Props> = {}

  copyLink = () => {
    const id = this.props.result.id
    copy(formatUrl(this.props.baseUrl, id))
  }

  render(): JSX.Element | null {
    const res = this.props.result
    if (res) {
      const baseUrl = this.props.baseUrl
      return res.code === 'created' ? SuccessResult(baseUrl, res, this.copyLink) : ErrorResult(res)
    }
    return null
  }
}
