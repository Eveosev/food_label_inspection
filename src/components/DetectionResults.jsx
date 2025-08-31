import React from 'react'
import { 
  Card, 
  Tag, 
  Table, 
  Progress, 
  Button, 
  Space, 
  Row, 
  Col,
  Typography,
  Divider,
  List,
  Badge
} from 'antd'
import { 
  DownloadOutlined, 
  ReloadOutlined, 
  SaveOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const { Title, Text } = Typography

const DetectionResults = ({ results, onReset }) => {
  const { 基本信息, 合规性评估, 详细检测结果, 不规范内容汇总, 整改优先级排序 } = results

  // 合规率环形图配置
  const complianceChartOption = {
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: parseInt(合规性评估.合规率),
            name: '合规',
            itemStyle: {
              color: '#52c41a'
            }
          },
          {
            value: 100 - parseInt(合规性评估.合规率),
            name: '不合规',
            itemStyle: {
              color: '#f5222d'
            }
          }
        ]
      }
    ]
  }

  // 表格列配置
  const columns = [
    {
      title: '检测项目',
      dataIndex: '检测项目',
      key: '检测项目',
      width: 120,
    },
    {
      title: '检测结果',
      dataIndex: '检测结果',
      key: '检测结果',
      width: 100,
      render: (result) => {
        const color = result === '合格' ? 'green' : result === '不合格' ? 'red' : 'orange'
        return <Tag color={color}>{result}</Tag>
      }
    },
    {
      title: '合规性',
      dataIndex: '风险等级',
      key: '风险等级',
      width: 100,
      render: (level) => {
        const color = level === '无风险' ? 'green' : level === '高风险' ? 'red' : 'orange'
        return <Tag color={color}>{level}</Tag>
      }
    },
    {
      title: '依据标准',
      dataIndex: '标准要求',
      key: '标准要求',
      width: 200,
      ellipsis: true,
    },
    {
      title: '建议',
      dataIndex: '整改建议',
      key: '整改建议',
      ellipsis: true,
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case '合格': return 'green'
      case '基本合格': return 'orange'
      case '不合格': return 'red'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case '合格': return <CheckCircleOutlined />
      case '基本合格': return <ExclamationCircleOutlined />
      case '不合格': return <CloseCircleOutlined />
      default: return null
    }
  }

  return (
    <div>
      {/* 基本信息卡片 */}
      <Card id="basic-info" className="result-card">
        <Row gutter={24} align="middle">
          <Col xs={24} md={16}>
            <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
              {基本信息.产品名称}
            </Title>
            <Space size="large">
              <Tag color="blue">{基本信息.产品类型}</Tag>
              <Tag color="purple">{基本信息.包装面积分类}</Tag>
              <Text type="secondary">检测时间：{基本信息.检测时间}</Text>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Tag 
              color={getStatusColor(合规性评估.总体评级)}
              icon={getStatusIcon(合规性评估.总体评级)}
              size="large"
              style={{ fontSize: '16px', padding: '8px 16px' }}
            >
              {合规性评估.总体评级}
            </Tag>
            <div style={{ marginTop: '8px' }}>
              <Space>
                <Button type="primary" icon={<DownloadOutlined />} size="small">
                  导出报告
                </Button>
                <Button icon={<SaveOutlined />} size="small">
                  保存结果
                </Button>
                <Button icon={<ReloadOutlined />} size="small" onClick={onReset}>
                  重新检测
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 合规性评估概览 */}
      <Card id="compliance" className="result-card">
        <Title level={4}>合规性评估</Title>
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <div className="chart-container">
              <ReactECharts 
                option={complianceChartOption} 
                style={{ height: '200px', width: '100%' }}
              />
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Text strong style={{ fontSize: '24px' }}>
                  {合规性评估.合规率}
                </Text>
                <br />
                <Text type="secondary">合规率</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <div style={{ marginTop: '16px' }}>
              <Text strong>总体评级: </Text>
              <Tag color={getStatusColor(合规性评估.总体评级)} size="large">
                {合规性评估.总体评级}
              </Tag>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Text strong>关键问题: </Text>
              <Tag color="red" size="large">{合规性评估.关键问题}</Tag>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Text strong>一般问题: </Text>
              <Tag color="orange" size="large">{合规性评估.一般问题}</Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 详细检测结果表格 */}
      <Card id="detailed-results" className="result-card">
        <Title level={4}>详细检测结果</Title>
        <Table
          columns={columns}
          dataSource={详细检测结果}
          rowKey={(record, index) => index}
          pagination={false}
          scroll={{ x: 800 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px', background: '#fafafa' }}>
                <p><strong>实际情况：</strong>{record.实际情况}</p>
                <p><strong>问题描述：</strong>{record.问题描述}</p>
              </div>
            ),
          }}
        />
      </Card>

      {/* 不规范内容汇总 */}
      {不规范内容汇总 && (
        <Card id="non-compliant" className="result-card">
          <Title level={4}>不规范内容汇总</Title>
          {Object.entries(不规范内容汇总).map(([riskLevel, issues]) => {
            if (!Array.isArray(issues) || issues.length === 0) return null
            
            return (
              <div key={riskLevel} style={{ marginBottom: '24px' }}>
                <Title level={5}>
                  <Badge 
                    count={issues.length} 
                    style={{ 
                      backgroundColor: riskLevel === '高风险问题' ? '#f5222d' : 
                                     riskLevel === '中风险问题' ? '#faad14' : '#52c41a'
                    }}
                  />
                  {riskLevel}
                </Title>
                <List
                  dataSource={issues}
                  renderItem={(issue, index) => (
                    <List.Item>
                      <Card size="small" style={{ width: '100%' }}>
                        <List.Item.Meta
                          title={
                            <Space>
                              <span className="priority-badge">{index + 1}</span>
                              {issue.问题项目}
                            </Space>
                          }
                          description={
                            <div>
                              <p><strong>不规范表现：</strong>{issue.不规范表现}</p>
                              <p><strong>违反条款：</strong>{issue.违反条款}</p>
                              <p><strong>法律风险：</strong>{issue.法律风险}</p>
                              <p><strong>整改要求：</strong>{issue.整改要求}</p>
                            </div>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              </div>
            )
          })}
        </Card>
      )}

      {/* 整改优先级排序 */}
      {整改优先级排序 && (
        <Card id="priority" className="result-card">
          <Title level={4}>整改优先级排序</Title>
          <Table
            columns={[
              {
                title: '优先级',
                dataIndex: '优先级',
                key: '优先级',
                width: 80,
                render: (priority) => (
                  <span className="priority-badge">{priority}</span>
                )
              },
              {
                title: '问题描述',
                dataIndex: '问题',
                key: '问题',
                width: 200,
              },
              {
                title: '涉及项目',
                dataIndex: '问题',
                key: '涉及项目',
                width: 150,
                render: (problem) => {
                  // 根据问题描述推断涉及项目
                  if (problem.includes('日期')) return '日期标示'
                  if (problem.includes('配料')) return '配料表规范'
                  if (problem.includes('致敏')) return '致敏物质提示'
                  if (problem.includes('标准')) return '产品标准代号'
                  return '其他'
                }
              },
              {
                title: '建议措施',
                dataIndex: '整改建议',
                key: '整改建议',
                ellipsis: true,
              }
            ]}
            dataSource={整改优先级排序}
            rowKey={(record, index) => index}
            pagination={false}
          />
        </Card>
      )}
    </div>
  )
}

export default DetectionResults 