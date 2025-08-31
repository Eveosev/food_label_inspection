import React from 'react'
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Row, 
  Col,
  Tag,
  Divider,
  Alert
} from 'antd'
import { 
  DownloadOutlined, 
  ReloadOutlined, 
  SaveOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import '../styles/markdown.css'

const { Title, Text } = Typography

const MarkdownDetectionResults = ({ results, onReset }) => {
  console.log('MarkdownDetectionResults received results:', results)
  
  // 从流式响应中提取数据
  const extractContent = () => {
    if (!results?.dify_result?.outputs) {
      return {
        hasContent: false,
        markdownContent: '暂无检测结果',
        metadata: {}
      }
    }

    const outputs = results.dify_result.outputs
    console.log('Extracted outputs:', outputs)
    
    // 尝试不同的可能字段名
    let markdownContent = ''
    let hasContent = false
    
    // 常见的输出字段名
    const possibleFields = [
      'text', 'result', 'output', 'content', 'markdown', 
      '检测结果', '分析结果', '报告', '结果',
      'answer', 'response', 'detection_result'
    ]
    
    for (const field of possibleFields) {
      if (outputs[field] && typeof outputs[field] === 'string') {
        markdownContent = outputs[field]
        hasContent = true
        console.log(`Found content in field: ${field}`)
        break
      }
    }
    
    // 如果没有找到内容，显示所有输出
    if (!hasContent) {
      markdownContent = '## 检测结果\n\n```json\n' + JSON.stringify(outputs, null, 2) + '\n```'
      hasContent = true
    }
    
    // 提取元数据
    const metadata = results.dify_result.metadata || {}
    
    return {
      hasContent,
      markdownContent,
      metadata,
      rawOutputs: outputs
    }
  }

  const { hasContent, markdownContent, metadata, rawOutputs } = extractContent()

  // 获取文件信息
  const fileInfo = results?.file_info || {}
  const inputParams = results?.input_params || {}
  
  return (
    <div>
      {/* 基本信息卡片 */}
      <Card className="result-card">
        <Row gutter={24} align="middle">
          <Col xs={24} md={16}>
            <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              食品标签检测完成
            </Title>
            <Space size="large" wrap>
              <Tag color="blue">{fileInfo.filename || '未知文件'}</Tag>
              <Tag color="purple">{inputParams.Foodtype || '未知类型'}</Tag>
              <Tag color="green">{inputParams.PackageFoodType || '未知包装'}</Tag>
              <Text type="secondary">
                检测时间：{new Date().toLocaleString()}
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '16px' }}>
              <Space direction="vertical" size="small">
                {metadata.total_tokens && (
                  <Text type="secondary">
                    <InfoCircleOutlined /> 消耗令牌: {metadata.total_tokens.toLocaleString()}
                  </Text>
                )}
                {metadata.total_price && (
                  <Text type="secondary">
                    💰 费用: ${metadata.total_price}
                  </Text>
                )}
                {metadata.elapsed_time && (
                  <Text type="secondary">
                    ⏱️ 用时: {metadata.elapsed_time.toFixed(2)}s
                  </Text>
                )}
              </Space>
            </div>
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
          </Col>
        </Row>
      </Card>

      {/* 检测参数信息 */}
      {Object.keys(inputParams).length > 0 && (
        <Card className="result-card">
          <Title level={4}>检测参数</Title>
          <Row gutter={[16, 16]}>
            {Object.entries(inputParams).map(([key, value]) => (
              value && (
                <Col xs={24} sm={12} md={8} key={key}>
                  <div>
                    <Text strong>{key}: </Text>
                    <Tag color="blue">{value}</Tag>
                  </div>
                </Col>
              )
            ))}
          </Row>
        </Card>
      )}

      {/* 主要检测结果 - Markdown渲染 */}
      <Card className="result-card">
        <Title level={4}>检测结果报告</Title>
        
        {hasContent ? (
          <div className="markdown-content">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // 自定义组件样式
                h1: ({children}) => <Title level={2}>{children}</Title>,
                h2: ({children}) => <Title level={3}>{children}</Title>,
                h3: ({children}) => <Title level={4}>{children}</Title>,
                h4: ({children}) => <Title level={5}>{children}</Title>,
                table: ({children}) => (
                  <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                    <table className="ant-table-content" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({children}) => (
                  <th style={{ 
                    padding: '8px 16px', 
                    background: '#fafafa', 
                    border: '1px solid #f0f0f0',
                    fontWeight: 'bold',
                    textAlign: 'left'
                  }}>
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td style={{ 
                    padding: '8px 16px', 
                    border: '1px solid #f0f0f0'
                  }}>
                    {children}
                  </td>
                ),
                blockquote: ({children}) => (
                  <Alert
                    message={children}
                    type="info"
                    showIcon
                    style={{ margin: '16px 0' }}
                  />
                ),
                code: ({inline, children}) => {
                  if (inline) {
                    return <code style={{ 
                      background: '#f6f8fa', 
                      padding: '2px 4px', 
                      borderRadius: '3px',
                      fontSize: '85%'
                    }}>{children}</code>
                  }
                  return (
                    <pre style={{ 
                      background: '#f6f8fa', 
                      padding: '16px', 
                      borderRadius: '6px',
                      overflow: 'auto',
                      border: '1px solid #e1e4e8'
                    }}>
                      <code>{children}</code>
                    </pre>
                  )
                }
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        ) : (
          <Alert
            message="暂无检测结果"
            description="检测可能尚未完成或出现了问题，请稍后重试。"
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* 原始数据（调试用，可选显示） */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="result-card">
          <Title level={4}>调试信息（开发模式）</Title>
          <details>
            <summary style={{ cursor: 'pointer', padding: '8px 0' }}>
              <Text strong>点击查看原始输出数据</Text>
            </summary>
            <pre style={{ 
              background: '#f6f8fa', 
              padding: '16px', 
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '12px',
              maxHeight: '300px'
            }}>
              {JSON.stringify(rawOutputs, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  )
}

export default MarkdownDetectionResults
