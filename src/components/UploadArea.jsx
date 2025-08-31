import React from 'react'
import { Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

const { Dragger } = Upload

const UploadArea = ({ uploadedFiles, onFileUpload }) => {
  const uploadProps = {
    name: 'file',
    multiple: true,
    fileList: uploadedFiles,
    onChange: onFileUpload,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isImage && !isPdf) {
        message.error('只支持 JPG、PNG、PDF 格式的文件！')
        return false
      }

      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！')
        return false
      }

      return false // 阻止自动上传
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
  }

  return (
    <div style={{ width: '100%' }}>
      <Dragger {...uploadProps} className="upload-area">
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
          点击或拖拽图片/文件到此处上传
        </p>
        <p className="ant-upload-hint" style={{ fontSize: '14px', color: '#666' }}>
          支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
        </p>
      </Dragger>
      
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4>已上传文件：</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {uploadedFiles.map((file, index) => (
              <li key={index} style={{ 
                padding: '8px', 
                margin: '4px 0', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{file.name}</span>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default UploadArea 