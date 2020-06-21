import React from 'react'
import { DeleteOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import { Button, Tooltip, Table, Popconfirm, Divider } from 'antd'
import { toUrlString, formatDate } from '../utils/strUtils'

import UrlsApi, { UrlEntry } from '../utils/urlsApi'

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
        render: (id: string): JSX.Element => <a href={toUrlString(baseUrl, id)}>{id}</a>,
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

    const hasSelected = selectedRowKeys.length > 0

    // delete selected

    // <Popconfirm title="Delete?" onConfirm={() => onDelete(item.id)}>
    //   <Button>Delete</Button>
    // </Popconfirm>

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={this.fetch} loading={loading}>
            Update
          </Button>

          <span style={{ marginLeft: 8 }}>
            {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
          </span>

          <Popconfirm title="Remove selected URLs?" onConfirm={this.deleteSelected}>
            <Tooltip title="Remove">
              <Button icon={<DeleteOutlined />} disabled={!hasSelected} />
            </Tooltip>
          </Popconfirm>
        </div>
        <Divider />

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
