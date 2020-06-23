import React from 'react'
import { DeleteOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import { Button, Tooltip, Table, Popconfirm, Space } from 'antd'
import { formatUrl, formatDate } from '../utils/strUtils'
import ResizeableTitle from '../components/resizeableTitle'

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
  cols: ColumnsType<UrlEntry>
}

export default class UrlTable extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {}

  public state: State = {
    selectedRowKeys: [],
    loading: false,
    editMode: false,
    items: [],
    cols: this.getColumns(),
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
        render: (id): JSX.Element => <a href={formatUrl(baseUrl, id)}>{id}</a>,
        width: 200,
      },
      {
        title: 'URL',
        dataIndex: 'url',
        key: 'url',
        render: (url): JSX.Element => (
          <Tooltip placement="topLeft" title={url}>
            {url}
          </Tooltip>
        ),
        ellipsis: true,
        width: 400,
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: renderDate,
        width: 200,
      },
      {
        title: 'Last Access',
        dataIndex: 'lastAccess',
        key: 'lastAccess',
        render: renderDate,
        width: 200,
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

  handleResize = index => (e, { size }) => {
    this.setState(({ cols }) => {
      const next = [...cols]
      next[index].width = size.width
      return { cols: next }
    })
  }

  render() {
    const columns: any = this.state.cols.map((c, index) => ({
      ...c,
      onHeaderCell: col => ({
        width: col.width,
        onResize: this.handleResize(index),
      }),
    }))

    const components = {
      header: {
        cell: ResizeableTitle,
      },
    }

    const { loading, selectedRowKeys } = this.state
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    }

    const selectCount = selectedRowKeys.length

    return (
      <div className="UrlSubmitTable">
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
          bordered
          components={components}
          rowSelection={rowSelection}
          dataSource={this.state.items}
          columns={columns as any}
        />
      </div>
    )
  }
}
