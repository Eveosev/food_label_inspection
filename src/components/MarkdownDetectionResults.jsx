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

  // 智能内容解析和优化显示
  const renderOptimizedContent = (content, rawData) => {
    console.log('renderOptimizedContent called with:', { content, rawData })
    
    // 尝试解析JSON内容
    let jsonData = null
    try {
      if (typeof content === 'string' && content.includes('```json')) {
        // 提取JSON代码块
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          console.log('Found JSON in markdown:', jsonMatch[1])
          jsonData = JSON.parse(jsonMatch[1])
          console.log('Parsed JSON data:', jsonData)
        }
      } else if (rawData && typeof rawData === 'object') {
        console.log('Using rawData as JSON:', rawData)
        jsonData = rawData
      }
    } catch (e) {
      console.error('JSON解析失败:', e)
      console.log('使用原始内容')
    }
    
    if (jsonData) {
      console.log('Rendering structured content with:', jsonData)
      return renderStructuredContent(jsonData, content)
    } else {
      console.log('Rendering markdown content with:', content)
      return renderMarkdownContent(content)
    }
  }

  // 渲染结构化内容
  const renderStructuredContent = (data, originalContent) => {
    console.log('renderStructuredContent called with data:', data)
    
    return (
      <div>
        {/* 1. 不规范内容统计 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#cf1322', marginBottom: '16px' }}>
            📊 不规范内容统计
          </Title>
          {renderJsonSection(data, '不规范内容统计')}
        </div>
        
        {/* 2. 不规范内容汇总 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#cf1322', marginBottom: '16px' }}>
            ⚠️ 不规范内容汇总
          </Title>
          {renderJsonSection(data, '不规范内容汇总')}
        </div>
        
        {/* 3. 基本信息 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#1890ff', marginBottom: '16px' }}>
            ℹ️ 基本信息
          </Title>
          {renderJsonSection(data, '基本信息')}
        </div>
        
        {/* 4. 合规性评估 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#52c41a', marginBottom: '16px' }}>
            ✅ 合规性评估
          </Title>
          {renderJsonSection(data, '合规性评估')}
        </div>
        
        {/* 5. 整改优先级排序 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#fa8c16', marginBottom: '16px' }}>
            🔄 整改优先级排序
          </Title>
          {renderJsonSection(data, '整改优先级排序')}
        </div>
        
        {/* 6. 豁免情况 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#722ed1', marginBottom: '16px' }}>
            🛡️ 豁免情况
          </Title>
          {renderJsonSection(data, '豁免情况')}
        </div>
        
        {/* 7. 详细检测结果 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#13c2c2', marginBottom: '16px' }}>
            🔍 详细检测结果
          </Title>
          {renderJsonSection(data, '详细检测结果')}
        </div>
        
        {/* 8. 不规范内容总结报告 - Markdown格式 */}
        <Divider />
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#cf1322', marginBottom: '16px' }}>
            📝 不规范内容总结报告
          </Title>
          {renderNonCompliantReport(originalContent)}
        </div>
      </div>
    )
  }

  // 渲染JSON section - 按照展示格式.jpg的样式
  const renderJsonSection = (data, sectionName) => {
    const sectionData = data[sectionName]
    
    if (!sectionData) {
      return (
        <div style={{ 
          padding: '16px', 
          background: '#fafafa', 
          borderRadius: '8px',
          border: '1px solid #d9d9d9',
          textAlign: 'center'
        }}>
          <Text type="secondary">未找到 {sectionName} 数据</Text>
        </div>
      )
    }
    
    // 如果是数组（如详细检测结果）
    if (Array.isArray(sectionData)) {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#ffffff', 
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          {sectionData.map((item, index) => (
            <div key={index} style={{ 
              marginBottom: index < sectionData.length - 1 ? '20px' : '0',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
                检测项目 {index + 1}
              </Title>
              {Object.entries(item).map(([key, value]) => (
                <div key={key} style={{ 
                  display: 'flex', 
                  marginBottom: '8px',
                  alignItems: 'flex-start'
                }}>
                  <Text strong style={{ 
                    minWidth: '100px', 
                    marginRight: '12px',
                    color: '#262626'
                  }}>
                    {key}:
                  </Text>
                  <div style={{ flex: 1 }}>
                    <Tag 
                      color={getTagColor(key, value)} 
                      style={{ 
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        maxWidth: '100%',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}
                    >
                      {String(value)}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    }
    
    // 如果是对象
    if (typeof sectionData === 'object') {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#ffffff', 
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          {Object.entries(sectionData).map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              marginBottom: '8px',
              alignItems: 'flex-start'
            }}>
              <Text strong style={{ 
                minWidth: '100px', 
                marginRight: '12px',
                color: '#262626'
              }}>
                {key}:
              </Text>
              <div style={{ flex: 1 }}>
                <Tag 
                  color={getTagColor(key, value)} 
                  style={{ 
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                >
                  {String(value)}
                </Tag>
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    // 如果是字符串
    return (
      <div style={{ 
        padding: '20px', 
        background: '#ffffff', 
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Tag 
          color="blue" 
          style={{ 
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            maxWidth: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        >
          {String(sectionData)}
        </Tag>
      </div>
    )
  }

  // 获取标签颜色
  const getTagColor = (key, value) => {
    const valueStr = String(value).toLowerCase()
    
    // 风险等级颜色
    if (key === '风险等级') {
      if (valueStr.includes('高风险')) return 'red'
      if (valueStr.includes('中风险')) return 'orange'
      if (valueStr.includes('低风险')) return 'green'
    }
    
    // 检测结果颜色
    if (key === '检测结果') {
      if (valueStr.includes('合格')) return 'green'
      if (valueStr.includes('不合格')) return 'red'
      if (valueStr.includes('基本合格')) return 'orange'
    }
    
    // 总体评级颜色
    if (key === '总体评级') {
      if (valueStr.includes('合格')) return 'green'
      if (valueStr.includes('不合格')) return 'red'
    }
    
    // 默认颜色
    return 'blue'
  }

  // 渲染不规范内容总结报告 - Markdown格式
  const renderNonCompliantReport = (content) => {
    if (!content || typeof content !== 'string') {
      return (
        <div style={{ 
          padding: '16px', 
          background: '#fff7e6', 
          borderRadius: '8px',
          border: '1px solid #ffd591',
          textAlign: 'center'
        }}>
          <Text type="secondary">未找到不规范内容总结报告</Text>
        </div>
      )
    }
    
    // 查找「不规范内容总结报告」的位置
    const reportIndex = content.indexOf('不规范内容总结报告')
    if (reportIndex === -1) {
      return (
        <div style={{ 
          padding: '16px', 
          background: '#fff7e6', 
          borderRadius: '8px',
          border: '1px solid #ffd591',
          textAlign: 'center'
        }}>
          <Text type="secondary">未找到不规范内容总结报告</Text>
        </div>
      )
    }
    
    // 提取从「不规范内容总结报告」开始的内容
    const reportContent = content.substring(reportIndex)
    
    return (
      <div style={{ 
        padding: '20px', 
        background: '#fff7e6', 
        borderRadius: '8px',
        border: '1px solid #ffd591',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({children}) => <Title level={3} style={{ color: '#cf1322' }}>{children}</Title>,
            h2: ({children}) => <Title level={4} style={{ color: '#cf1322' }}>{children}</Title>,
            h3: ({children}) => <Title level={5} style={{ color: '#cf1322' }}>{children}</Title>,
            p: ({children}) => <Text style={{ lineHeight: '1.6', marginBottom: '12px' }}>{children}</Text>,
            ul: ({children}) => <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>{children}</ul>,
            ol: ({children}) => <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>{children}</ol>,
            li: ({children}) => <li style={{ marginBottom: '4px' }}>{children}</li>,
            strong: ({children}) => <Text strong style={{ color: '#cf1322' }}>{children}</Text>,
            code: ({inline, children}) => {
              if (inline) {
                return <code style={{ 
                  background: '#f6f8fa', 
                  padding: '2px 4px', 
                  borderRadius: '3px',
                  fontSize: '85%',
                  color: '#cf1322'
                }}>{children}</code>
              }
              return (
                <pre style={{ 
                  background: '#f6f8fa', 
                  padding: '16px', 
                  borderRadius: '6px',
                  overflow: 'auto',
                  border: '1px solid #e1e4e8',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  <code>{children}</code>
                </pre>
              )
            }
          }}
        >
          {reportContent}
        </ReactMarkdown>
      </div>
    )
  }

  // 渲染Markdown内容
  const renderMarkdownContent = (content) => {
    return (
      <div style={{ 
        padding: '20px', 
        background: '#ffffff', 
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <pre style={{ 
                  background: '#f6f8fa', 
                  padding: '16px', 
                  borderRadius: '6px',
                  overflow: 'auto',
                  border: '1px solid #e1e4e8',
                  fontSize: '14px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }
  
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

      {/* 主要检测结果 - 智能渲染 */}
      <Card className="result-card">
        <Title level={4}>检测结果报告</Title>
        
        {hasContent ? (
          <div>
            {renderOptimizedContent(markdownContent, rawOutputs)}
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
