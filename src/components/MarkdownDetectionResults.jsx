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
        // console.log(`Found content in field: ${field}`)
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

  // 辅助函数：从字符串中提取最大的JSON对象
  const extractLargestJsonObject = (text) => {
    if (!text || typeof text !== 'string') return null
    
    let maxJson = null
    let maxLength = 0
    
    // 查找所有可能的JSON对象
    let braceCount = 0
    let startIndex = -1
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      if (char === '{') {
        if (braceCount === 0) {
          startIndex = i
        }
        braceCount++
      } else if (char === '}') {
        braceCount--
        
        if (braceCount === 0 && startIndex !== -1) {
          // 找到一个完整的JSON对象
          const jsonCandidate = text.substring(startIndex, i + 1)
          console.log('Found JSON candidate:', jsonCandidate.substring(0, 100) + '...')
          
          // 验证是否为有效的JSON
          try {
            JSON.parse(jsonCandidate)
            if (jsonCandidate.length > maxLength) {
              maxJson = jsonCandidate
              maxLength = jsonCandidate.length
              console.log('New largest JSON found, length:', maxLength)
            }
          } catch (e) {
            console.log('Invalid JSON candidate:', e.message)
          }
          
          startIndex = -1
        }
      }
    }
    
    return maxJson
  }

  // 智能内容解析和优化显示
  const renderOptimizedContent = (content, rawData) => {
    console.log('renderOptimizedContent called with:', { content, rawData })
    
    // 尝试解析JSON内容
    let jsonData = null
    let markdownContent = null
    
    try {
      // 方法1: 检查rawData是否已经包含分离后的数据
      if (rawData && rawData.json_data && rawData.markdown_content) {
        console.log('Using pre-separated data from backend')
        jsonData = rawData.json_data
        markdownContent = rawData.markdown_content
        console.log('JSON data from backend:', jsonData)
        console.log('Markdown content from backend:', markdownContent)
      }
      
      // 方法2: 尝试从content中提取JSON（使用正则表达式）
      if (!jsonData && typeof content === 'string') {
        console.log('Attempting to extract JSON from content using regex')
        const contentJsonMatch = content.match(/\{.*([\s\S]*?).*\}/)
        if (contentJsonMatch) {
          console.log('Found JSON in content:', contentJsonMatch[0])
          try {
            jsonData = JSON.parse(contentJsonMatch[0])
            console.log('Successfully parsed JSON from content:', jsonData)
          } catch (e) {
            console.log('Failed to parse JSON from content:', e.message)
          }
        }
      }
      
      // 方法3: 尝试从markdown代码块中提取JSON
      if (!jsonData && typeof content === 'string' && content.includes('```json')) {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          console.log('Found JSON in markdown:', jsonMatch[1])
          jsonData = JSON.parse(jsonMatch[1])
          console.log('Parsed JSON data:', jsonData)
        }
      }
      
      // 方法4: 使用rawData作为JSON
      if (!jsonData && rawData && typeof rawData === 'object') {
        console.log('Using rawData as JSON:', rawData)
        jsonData = rawData
      }
      
      // 方法5: 尝试直接解析content是否为JSON
      if (!jsonData && typeof content === 'string') {
        try {
          const trimmedContent = content.trim()
          if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
            console.log('Attempting to parse content as JSON directly')
            jsonData = JSON.parse(trimmedContent)
            console.log('Successfully parsed content as JSON:', jsonData)
          }
        } catch (e) {
          console.log('Content is not valid JSON, using as markdown')
        }
      }
      
      // 如果还是没有JSON数据，尝试从rawData中提取text字段
      if (!jsonData && rawData && rawData.text && typeof rawData.text === 'string') {
        try {
          console.log('Attempting to parse rawData.text as JSON:', rawData.text)
          
          // 方法1: 从「不规范内容总结报告」处截断，找到前面的最大的JSON字段
          const reportIndex = rawData.text.indexOf('不规范内容总结报告')
          if (reportIndex !== -1) {
            const beforeReport = rawData.text.substring(0, reportIndex).trim()
            console.log('Content before report:', beforeReport)
            
            // 在截断的内容中查找最大的JSON对象
            const jsonFromReport = extractLargestJsonObject(beforeReport)
            if (jsonFromReport) {
              console.log('Extracted JSON from before report:', jsonFromReport)
              jsonData = JSON.parse(jsonFromReport)
              console.log('Successfully parsed JSON from before report:', jsonData)
            }
          }
          
          // 方法2: 如果方法1失败，直接从整个字符串中找到最大的"{}"包围的JSON字段
          if (!jsonData) {
            const largestJson = extractLargestJsonObject(rawData.text)
            if (largestJson) {
              console.log('Extracted largest JSON object:', largestJson)
              jsonData = JSON.parse(largestJson)
              console.log('Successfully parsed largest JSON object:', jsonData)
            }
          }
          
          // 方法3: 原有的正则表达式方法作为fallback
          if (!jsonData) {
            const jsonMatch = rawData.text.match(/\{.*([\s\S]*?).*\}/)
            if (jsonMatch) {
              const jsonString = jsonMatch[1]
              console.log('Extracted JSON string (fallback):', jsonString)
              jsonData = JSON.parse(jsonString)
              console.log('Successfully parsed extracted JSON (fallback):', jsonData)
            }
          }
          
        } catch (e) {
          console.log('rawData.text is not valid JSON:', e)
        }
      }
    } catch (e) {
      console.error('JSON解析失败:', e)
      console.log('使用原始内容')
    }
    
    if (jsonData) {
      console.log('Rendering structured content with:', jsonData)
      // 如果有分离后的markdown内容，使用它；否则使用原始content
      const finalMarkdownContent = markdownContent || content
      return renderStructuredContent(jsonData, finalMarkdownContent)
    } else {
      console.log('Rendering markdown content with:', content)
      return renderMarkdownContent(content)
    }
  }

  // 渲染结构化内容
  const renderStructuredContent = (data, originalContent) => {
    console.log('renderStructuredContent called with data:', data)
    console.log('renderStructuredContent data type:', typeof data)
    console.log('renderStructuredContent data keys:', data ? Object.keys(data) : 'data is null/undefined')
    
    // 打印每个section的数据
    const sections = ['不规范内容统计', '不规范内容汇总', '基本信息', '合规性评估', '整改优先级排序', '豁免情况', '详细检测结果']
    sections.forEach(section => {
      console.log(`${section} data:`, data ? data[section] : 'data is null/undefined')
    })
    
    return (
      <div>
        {/* 1. 不规范内容总结报告 - Markdown格式 - 提到最前面展示 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#cf1322', marginBottom: '16px' }}>
            不规范内容总结报告
          </Title>
          {renderNonCompliantReport(originalContent)}
        </div>
        
        <Divider />
        
        {/* 2. 不规范内容统计 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#cf1322', marginBottom: '16px' }}>
            不规范内容统计
          </Title>
          {renderJsonSection(data, '不规范内容统计')}
        </div>
        
        {/* 3. 基本信息 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#1890ff', marginBottom: '16px' }}>
            基本信息
          </Title>
          {renderJsonSection(data, '基本信息')}
        </div>
        
        {/* 4. 合规性评估 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#52c41a', marginBottom: '16px' }}>
            合规性评估
          </Title>
          {renderJsonSection(data, '合规性评估')}
        </div>
        
        {/* 5. 整改优先级排序 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#fa8c16', marginBottom: '16px' }}>
            整改优先级排序
          </Title>
          {renderJsonSection(data, '整改优先级排序')}
        </div>
        
        {/* 6. 豁免情况 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#722ed1', marginBottom: '16px' }}>
            豁免情况
          </Title>
          {renderJsonSection(data, '豁免情况')}
        </div>
        
        {/* 7. 详细检测结果 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#13c2c2', marginBottom: '16px' }}>
            详细检测结果
          </Title>
          {renderJsonSection(data, '详细检测结果')}
        </div>
      </div>
    )
  }

  // 渲染JSON section - 按照展示格式.jpg的样式
  const renderJsonSection = (data, sectionName) => {
    console.log(`renderJsonSection called for ${sectionName}:`, data)
    const sectionData = data[sectionName]
    console.log(`${sectionName} sectionData:`, sectionData)
    console.log(`${sectionName} sectionData type:`, typeof sectionData)
    
    if (!sectionData) {
      console.log(`${sectionName} data not found`)
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
