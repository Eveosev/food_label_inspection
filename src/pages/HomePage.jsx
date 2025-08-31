import React, { useState } from 'react'
import { 
  Card, 
  Upload, 
  Button, 
  Form, 
  Select, 
  DatePicker, 
  Checkbox, 
  Progress, 
  message,
  Row,
  Col,
  Space,
  Layout,
  Anchor,
  Typography,
  Tag,
  Divider
} from 'antd'
import { 
  InboxOutlined, 
  PlayCircleOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import UploadArea from '../components/UploadArea'
import DetectionForm from '../components/DetectionForm'
import DetectionResults from '../components/DetectionResults'
import MarkdownDetectionResults from '../components/MarkdownDetectionResults'
import { detectWithDify } from '../services/api'

const { Sider, Content } = Layout
const { Title, Text } = Typography

const HomePage = () => {
  const [form] = Form.useForm()
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [detectionResults, setDetectionResults] = useState(null)
  const [resultType, setResultType] = useState(null) // 'legacy' 或 'markdown'

  const handleFileUpload = (info) => {
    const { fileList } = info
    setUploadedFiles(fileList)
    
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`)
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`)
    }
  }

  const handleDetection = async (values) => {
    if (uploadedFiles.length === 0) {
      message.error('请先上传图片或文件')
      return
    }

    setIsDetecting(true)
    setDetectionProgress(0)

    try {
      // 模拟检测进度
      const progressInterval = setInterval(() => {
        setDetectionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // 调用检测API
      const formData = new FormData()
      // 只取第一个文件，因为新的API只支持单个文件
      if (uploadedFiles.length > 0) {
        formData.append('file', uploadedFiles[0].originFileObj)
      }
      
      // 添加表单数据
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined) {
          if (key === 'DetectionTime' && values[key]) {
            formData.append(key, values[key].format('YYYY-MM-DD'))
          } else if (key === 'SpecialRequirement') {
            // 处理特殊要求字段
            if (Array.isArray(values[key])) {
              formData.append(key, values[key].join(','))
            } else {
              formData.append(key, values[key] || '')
            }
          } else {
            formData.append(key, values[key])
          }
        }
      })

      const results = await detectWithDify(formData)
      
      clearInterval(progressInterval)
      setDetectionProgress(100)
      
      setTimeout(() => {
        setDetectionResults(results)
        setIsDetecting(false)
        setDetectionProgress(0)
        
        // 检测结果类型
        if (results?.dify_result) {
          // 新的流式响应格式
          setResultType('markdown')
          console.log('使用Markdown结果组件，数据:', results)
        } else if (results?.基本信息) {
          // 旧的结构化格式
          setResultType('legacy')
        } else {
          // 默认使用markdown格式
          setResultType('markdown')
        }
        
        // 检查是否是ReadError恢复的结果
        if (results?.dify_result?.read_error_occurred) {
          message.warning('检测已完成，但由于网络问题未获取完整结果。请查看下方显示的基本信息。')
        } else {
          message.success('检测完成！')
        }
      }, 500)

    } catch (error) {
      setIsDetecting(false)
      setDetectionProgress(0)
      
      // 改进错误处理，显示更具体的错误信息
      console.error('Detection error:', error)
      
      if (error.response?.status === 500) {
        const errorData = error.response?.data
        if (errorData?.detail?.includes('ReadError') || errorData?.detail?.includes('读取响应失败')) {
          message.error('网络连接不稳定，请稍后重试或检查网络状况')
        } else {
          message.error(`服务器错误: ${errorData?.detail || '未知错误'}`)
        }
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message.error('请求超时，请检查网络连接或稍后重试')
      } else if (error.response?.status === 422) {
        message.error('请求参数有误，请检查上传的文件和填写的信息')
      } else {
        message.error('检测失败，请重试')
      }
    }
  }

  const handleReset = () => {
    setUploadedFiles([])
    setDetectionResults(null)
    setResultType(null)
    form.resetFields()
  }

  const anchorItems = [
    {
      key: 'upload',
      href: '#upload',
      title: '上传区域',
    },
    {
      key: 'info',
      href: '#info',
      title: '信息选择',
    },
    {
      key: 'results',
      href: '#results',
      title: '检测结果',
      children: [
        {
          key: 'basic-info',
          href: '#basic-info',
          title: '基本信息',
        },
        {
          key: 'compliance',
          href: '#compliance',
          title: '合规性评估',
        },
        {
          key: 'detailed-results',
          href: '#detailed-results',
          title: '详细检测结果',
        },
        {
          key: 'non-compliant',
          href: '#non-compliant',
          title: '不规范内容汇总',
        },
        {
          key: 'priority',
          href: '#priority',
          title: '整改优先级排序',
        },
      ],
    },
  ]

  return (
    <Layout style={{ background: 'transparent' }}>
      <Content style={{ marginRight: '24px' }}>
        {!detectionResults ? (
          <>
            {/* 上传区域 */}
            <Card 
              id="upload"
              title="上传区域" 
              style={{ marginBottom: '24px' }}
              extra={
                <Space>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              }
            >
              <UploadArea 
                uploadedFiles={uploadedFiles}
                onFileUpload={handleFileUpload}
              />
              
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Title level={5}>已上传文件</Title>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileTextOutlined />
                        <span>{file.name}</span>
                        <Text type="secondary">({(file.size / 1024 / 1024).toFixed(2)} MB)</Text>
                      </div>
                      <Button 
                        type="text" 
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          const newFiles = uploadedFiles.filter((_, i) => i !== index)
                          setUploadedFiles(newFiles)
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={() => form.submit()}
                  disabled={uploadedFiles.length === 0}
                  style={{
                    height: '48px',
                    padding: '0 32px',
                    fontSize: '16px'
                  }}
                >
                  开始检测
                </Button>
              </div>
            </Card>

            {/* 检测表单 */}
            <Card id="info" title="信息选择" style={{ marginBottom: '24px' }}>
              <DetectionForm 
                form={form}
                onFinish={handleDetection}
                isDetecting={isDetecting}
              />
            </Card>

            {/* 检测进度 */}
            {isDetecting && (
              <Card title="检测进度" style={{ marginBottom: '24px' }}>
                <Progress 
                  percent={detectionProgress} 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p>正在分析标签信息，请稍候...</p>
                </div>
              </Card>
            )}
          </>
        ) : (
          /* 检测结果 */
          <div id="results">
            {resultType === 'legacy' ? (
              <DetectionResults 
                results={detectionResults}
                onReset={handleReset}
              />
            ) : (
              <MarkdownDetectionResults 
                results={detectionResults}
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </Content>

      {/* 右侧页面导航 */}
      <Sider width={200} style={{ background: 'transparent' }}>
        <Card title="页面导航" size="small">
          <Anchor
            items={anchorItems}
            style={{ fontSize: '14px' }}
          />
        </Card>
      </Sider>
    </Layout>
  )
}

export default HomePage 