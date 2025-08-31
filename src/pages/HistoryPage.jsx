import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Input, 
  DatePicker, 
  Select,
  message 
} from 'antd'
import { 
  SearchOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { getDetectionHistory } from '../services/api'

const { RangePicker } = DatePicker
const { Search } = Input

const HistoryPage = () => {
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const columns = [
    {
      title: '产品名称',
      dataIndex: '产品名称',
      key: '产品名称',
      width: 200,
      ellipsis: true,
    },
    {
      title: '检测时间',
      dataIndex: '检测时间',
      key: '检测时间',
      width: 120,
    },
    {
      title: '产品类型',
      dataIndex: '产品类型',
      key: '产品类型',
      width: 120,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '总体评级',
      dataIndex: '总体评级',
      key: '总体评级',
      width: 120,
      render: (status) => {
        const color = status === '合格' ? 'green' : status === '基本合格' ? 'orange' : 'red'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: '合规率',
      dataIndex: '合规率',
      key: '合规率',
      width: 100,
      render: (rate) => `${rate}%`
    },
    {
      title: '问题数量',
      dataIndex: '问题数量',
      key: '问题数量',
      width: 100,
      render: (count) => <Tag color="red">{count}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            onClick={() => handleExport(record)}
          >
            导出
          </Button>
        </Space>
      ),
    },
  ]

  useEffect(() => {
    fetchHistoryData()
  }, [])

  const fetchHistoryData = async (params = {}) => {
    setLoading(true)
    try {
      // 模拟数据
      const mockData = [
        {
          key: '1',
          产品名称: '稻香村月饼富贵佳礼盒（广式月饼）',
          检测时间: '2024-12-28',
          产品类型: '直接消费者',
          总体评级: '基本合格',
          合规率: '75%',
          问题数量: 4
        },
        {
          key: '2',
          产品名称: '蒙牛特仑苏纯牛奶',
          检测时间: '2024-12-27',
          产品类型: '直接消费者',
          总体评级: '合格',
          合规率: '95%',
          问题数量: 1
        },
        {
          key: '3',
          产品名称: '康师傅红烧牛肉面',
          检测时间: '2024-12-26',
          产品类型: '直接消费者',
          总体评级: '不合格',
          合规率: '60%',
          问题数量: 6
        }
      ]
      
      setHistoryData(mockData)
      setPagination(prev => ({ ...prev, total: mockData.length }))
    } catch (error) {
      message.error('获取检测记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (record) => {
    // 跳转到详情页面或打开详情弹窗
    console.log('查看详情:', record)
  }

  const handleExport = (record) => {
    // 导出报告
    console.log('导出报告:', record)
    message.success('报告导出成功')
  }

  const handleSearch = (value) => {
    console.log('搜索:', value)
    // 实现搜索逻辑
  }

  const handleTableChange = (pagination) => {
    setPagination(pagination)
    fetchHistoryData({
      page: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Card title="检测记录" extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => fetchHistoryData()}
        >
          刷新
        </Button>
      }>
        {/* 搜索区域 */}
        <div style={{ marginBottom: '16px' }}>
          <Space size="large">
            <Search
              placeholder="搜索产品名称"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 300 }}
              onSearch={handleSearch}
            />
            <RangePicker 
              placeholder={['开始日期', '结束日期']}
              style={{ width: 250 }}
            />
            <Select
              placeholder="选择产品类型"
              style={{ width: 150 }}
              allowClear
              options={[
                { label: '直接消费者', value: '直接消费者' },
                { label: '餐饮服务', value: '餐饮服务' },
                { label: '其他', value: '其他' }
              ]}
            />
            <Select
              placeholder="选择评级"
              style={{ width: 120 }}
              allowClear
              options={[
                { label: '合格', value: '合格' },
                { label: '基本合格', value: '基本合格' },
                { label: '不合格', value: '不合格' }
              ]}
            />
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={historyData}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  )
}

export default HistoryPage 