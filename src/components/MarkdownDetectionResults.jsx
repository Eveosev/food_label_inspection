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
  Alert,
  Tabs,
  Collapse
} from 'antd'
import { 
  DownloadOutlined, 
  ReloadOutlined, 
  SaveOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  CodeOutlined
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import '../styles/markdown.css'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Panel } = Collapse

const MarkdownDetectionResults = ({ results, onReset }) => {
  console.log('MarkdownDetectionResults received results:', results)
  
  // 智能内容解析函数
  const parseContent = (content) => {
    if (!content || typeof content !== 'string') {
      return { type: 'empty', content: '暂无内容' }
    }
    
    // 尝试解析JSON
    try {
      const jsonData = JSON.parse(content)
      return { type: 'json', content: jsonData }
    } catch (e) {
      // 不是JSON，检查是否包含JSON片段
      const jsonMatches = content.match(/\{[\s\S]*\}/g)
      if (jsonMatches && jsonMatches.length > 0) {
        return { 
          type: 'mixed', 
          content: content,
          jsonParts: jsonMatches
        }
      }
      // 纯文本或Markdown
      return { type: 'markdown', content: content }
    }
  }
  
  // 提取不规范内容汇总
  const extractNonCompliantContent = (jsonData) => {
    if (!jsonData || typeof jsonData !== 'object') return null
    
    // 查找不规范内容相关的字段
    const possibleFields = [
      '不规范内容汇总', '不规范内容总结报告', '整改优先级排序',
      'non_compliant_content', 'compliance_issues', 'rectification_priority'
    ]
    
    for (const field of possibleFields) {
      if (jsonData[field]) {
        return {
          field: field,
          content: jsonData[field]
        }
      }
    }
    
    return null
  }
  
  // 从流式响应中提取数据
  const extractContent = () => {
    if (!results?.dify_result?.outputs) {
      return {
        hasContent: false,
        content: '暂无检测结果',
        metadata: {}
      }
    }

    const outputs = results.dify_result.outputs
    console.log('Extracted outputs:', outputs)
    
    // 尝试不同的可能字段名
    let content = ''
    let hasContent = false
    
    // 常见的输出字段名
    const possibleFields = [
      'text', 'result', 'output', 'content', 'markdown', 
      '检测结果', '分析结果', '报告', '结果',
      'answer', 'response', 'detection_result'
    ]
    
    for (const field of possibleFields) {
      if (outputs[field] && typeof outputs[field] === 'string') {
        content = outputs[field]
        hasContent = true
        console.log(`Found content in field: ${field}`)
        break
      }
    }
    
    // 如果没有找到内容，尝试格式化所有输出
    if (!hasContent) {
      content = JSON.stringify(outputs, null, 2)
      hasContent = true
    }
    
    // 解析内容类型
    const parsedContent = parseContent(content)
    
    // 提取元数据
    const metadata = results.dify_result.metadata || {}
    
    return {
      hasContent,
      content: parsedContent,
      metadata,
      rawOutputs: outputs
    }
  }

  const { hasContent, content, metadata, rawOutputs } = extractContent()

  // 获取文件信息
  const fileInfo = results?.file_info || {}
  const inputParams = results?.input_params || {}
  
  // 渲染JSON内容 - 简化版本，实现两个核心需求
  const renderJsonContent = (jsonData) => {
    // 检查是否包含不规范内容
    const nonCompliantContent = extractNonCompliantContent(jsonData)
    
    // 如果有不规范内容，优先显示
    if (nonCompliantContent) {
      return (
        <div>
          {/* 不规范内容汇总 - 按第二张图片格式显示 */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ color: '#ff4d4f', marginBottom: '16px' }}>
              ⚠️ 不规范内容汇总
            </Title>
            {renderNonCompliantContent(nonCompliantContent)}
          </div>
          
          {/* 完整检测数据 - 按指定顺序展示 */}
          <Divider />
          <Title level={4}>完整检测数据</Title>
          {renderCompleteDetectionData(jsonData)}
        </div>
      )
    }
    
    // 没有不规范内容时，只显示完整检测数据
    return renderCompleteDetectionData(jsonData)
  }
  
  // 渲染不规范内容 - 按第二张图片格式显示
  const renderNonCompliantContent = (nonCompliantData) => {
    const { content } = nonCompliantData
    
    // 如果是对象，按key-value格式显示
    if (typeof content === 'object' && content !== null) {
      return (
        <div style={{ 
          padding: '16px', 
          background: '#fff7e6', 
          borderRadius: '8px',
          border: '1px solid #ffd591'
        }}>
          {Object.entries(content).map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              marginBottom: '12px',
              alignItems: 'flex-start'
            }}>
              <Text strong style={{ 
                minWidth: '120px', 
                marginRight: '16px',
                color: '#262626'
              }}>
                {key}:
              </Text>
              <div style={{ flex: 1 }}>
                {typeof value === 'string' ? (
                  <Text style={{ 
                    wordWrap: 'break-word', 
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    lineHeight: '1.6'
                  }}>
                    {value}
                  </Text>
                ) : (
                  <pre style={{ 
                    background: '#f6f8fa', 
                    padding: '12px', 
                    borderRadius: '6px',
                    overflow: 'auto',
                    border: '1px solid #e1e4e8',
                    fontSize: '12px',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal'
                  }}>
                    <code>{JSON.stringify(value, null, 2)}</code>
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    // 其他类型内容
    return (
      <div style={{ 
        padding: '16px', 
        background: '#fff7e6', 
        borderRadius: '8px',
        border: '1px solid #ffd591'
      }}>
        <pre style={{ 
          background: '#f6f8fa', 
          padding: '16px', 
          borderRadius: '6px',
          overflow: 'auto',
          border: '1px solid #e1e4e8',
          fontSize: '12px',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          whiteSpace: 'normal'
        }}>
          <code>{JSON.stringify(content, null, 2)}</code>
        </pre>
      </div>
    )
  }
  
  // 渲染完整检测数据 - 按指定顺序展示
  const renderCompleteDetectionData = (jsonData) => {
    const sections = [
      '基本信息', '合规性评估', '不规范内容统计', 
      '整改优先级排序', '豁免情况', '详细检测结果'
    ]
    
    return (
      <div style={{ 
        padding: '20px', 
        background: '#ffffff', 
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {sections.map((sectionName) => {
          const sectionData = jsonData[sectionName]
          if (!sectionData) return null
          
          return (
            <div key={sectionName} style={{ marginBottom: '20px' }}>
              <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
                {sectionName}
              </Title>
              <div style={{ paddingLeft: '16px' }}>
                {typeof sectionData === 'object' ? (
                  <div>
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
                          {typeof value === 'string' ? (
                            <Text style={{ 
                              wordWrap: 'break-word', 
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              lineHeight: '1.6'
                            }}>
                              {value}
                            </Text>
                          ) : (
                            <Tag color="blue" style={{ 
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              maxWidth: '100%'
                            }}>
                              {JSON.stringify(value)}
                            </Tag>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text>{String(sectionData)}</Text>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  
  // 渲染混合内容 - 在格式化显示中集成JSON和Markdown
  const renderMixedContent = (mixedContent) => {
    const { content, jsonParts } = mixedContent
    
    return (
      <div>
        <div className="markdown-content">
          {/* 先显示JSON数据 */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={4}>检测数据</Title>
            <Alert
              message="结构化检测结果"
              description="以下是以结构化方式显示的检测数据，包含详细的检测信息和评估结果"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            {/* 尝试解析并美化显示JSON数据 */}
            {jsonParts.map((jsonPart, index) => {
              try {
                const parsedData = JSON.parse(jsonPart)
                return (
                  <div key={index} style={{ marginBottom: '20px' }}>
                    <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
                      数据片段 {index + 1}
                    </Title>
                    {renderJsonContent(parsedData)}
                  </div>
                )
              } catch (e) {
                // 如果解析失败，显示原始代码
                return (
                  <Panel header={`数据片段 ${index + 1}`} key={index}>
                    <pre style={{ 
                      background: '#f6f8fa', 
                      padding: '16px', 
                      borderRadius: '6px',
                      overflow: 'auto',
                      border: '1px solid #e1e4e8',
                      fontSize: '12px',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      whiteSpace: 'normal'
                    }}>
                      <code>{jsonPart}</code>
                    </pre>
                  </Panel>
                )
              }
            })}
          </div>
          
          {/* 再显示Markdown内容 */}
          <Divider />
          <Title level={4}>详细报告</Title>
          <div style={{ 
            wordWrap: 'break-word', 
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            lineHeight: '1.6'
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
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
            {content.type === 'json' && (
              <div>
                <Alert
                  message="检测到JSON格式数据"
                  description="以下是以结构化方式显示的检测结果"
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                {renderJsonContent(content.content)}
              </div>
            )}
            
            {content.type === 'markdown' && (
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
                  {content.content}
                </ReactMarkdown>
              </div>
            )}
            
            {content.type === 'mixed' && renderMixedContent(content)}
            
            {content.type === 'empty' && (
              <Alert
                message="暂无检测结果"
                description="检测可能尚未完成或出现了问题，请稍后重试。"
                type="warning"
                showIcon
              />
            )}
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
