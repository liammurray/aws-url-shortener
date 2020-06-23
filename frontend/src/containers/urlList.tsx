import React from 'react'
import { DeleteOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import { Button, Tooltip, Table, Typography, Popconfirm, Space } from 'antd'
import { formatUrl, formatDate } from '../utils/strUtils'

import UrlsApi, { UrlEntry } from '../utils/urlsApi'

const { Text } = Typography

export function renderDate(iso: string): JSX.Element {
  const text = iso ? formatDate(iso) : ''
  return <div>{text}</div>
}

type Props = {
  urlsApi: UrlsApi
}

type State = {
  selectedRowKeys: string[]
  loading: boolean
  editMode: boolean
  items: UrlEntry[]
}

export default class UrlList extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {}

  public state: State = {
    selectedRowKeys: [],
    loading: false,
    editMode: false,
    items: [],
  }

  componentDidMount() {
    this.fetch()
  }

  fetch = async () => {
    this.setState({ loading: true })
    const res = await this.props.urlsApi.getUrls()
    this.setState({
      loading: false,
      selectedRowKeys: [],
      items: res,
    })
  }

  getColumns(): ColumnsType<UrlEntry> {
    const baseUrl = this.props.urlsApi.baseUrl
    return [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        render: (id: string): JSX.Element => <a href={formatUrl(baseUrl, id)}>{id}</a>,
      },
      {
        title: 'URL',
        dataIndex: 'url',
        key: 'url',
        render: (url: string): JSX.Element => <a href={url}>{url}</a>,
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: renderDate,
      },
      {
        title: 'Last Access',
        dataIndex: 'lastAccess',
        key: 'lastAccess',
        render: renderDate,
      },
      {
        title: 'Access count',
        dataIndex: 'accessCount',
        key: 'accessCount',
      },
    ]
  }

  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys })
  }

  deleteSelected = () => {
    console.log('deleteSelected')
  }

  render() {
    const columns = this.getColumns()

    const { loading, selectedRowKeys } = this.state
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    }

    const selectCount = selectedRowKeys.length

    return (
      <div>
        <Space>
          <Button type="primary" onClick={this.fetch} loading={loading}>
            Fetch Recent Links
          </Button>

          <Popconfirm
            title={`Remove items (${selectCount} selected)?`}
            onConfirm={this.deleteSelected}
            disabled={!selectCount}>
            <Tooltip title="Remove">
              <Button icon={<DeleteOutlined />} disabled={!selectCount} />
            </Tooltip>
          </Popconfirm>
        </Space>

        <Table
          rowKey="id"
          rowSelection={rowSelection}
          dataSource={this.state.items}
          columns={columns}
        />
      </div>
    )
  }
}
