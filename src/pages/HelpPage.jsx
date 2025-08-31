import React from 'react'
import { Card, Typography, Collapse, List, Alert, Space } from 'antd'
import { 
  QuestionCircleOutlined, 
  FileTextOutlined, 
  SafetyOutlined,
  UploadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const HelpPage = () => {
  const helpData = [
    {
      key: '1',
      label: '如何使用系统进行检测？',
      children: (
        <div>
          <Paragraph>
            <Text strong>步骤1：上传文件</Text>
          </Paragraph>
          <Paragraph>
            点击或拖拽食品包装图片到上传区域，支持 JPG、PNG、PDF 格式，文件大小不超过 10MB。
          </Paragraph>
          <Paragraph>
            <Text strong>步骤2：设置参数</Text>
          </Paragraph>
          <Paragraph>
            选择产品类型、包装面积分类、检测时间等必要参数，可根据需要选择特殊要求。
          </Paragraph>
          <Paragraph>
            <Text strong>步骤3：开始检测</Text>
          </Paragraph>
          <Paragraph>
            点击"开始智能检测"按钮，系统将自动分析标签信息并生成检测报告。
          </Paragraph>
        </div>
      )
    },
    {
      key: '2',
      label: '支持哪些文件格式？',
      children: (
        <div>
          <List
            size="small"
            dataSource={[
              'JPG/JPEG 图片文件',
              'PNG 图片文件', 
              'PDF 文档文件'
            ]}
            renderItem={(item) => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                {item}
              </List.Item>
            )}
          />
          <Alert
            message="注意事项"
            description="文件大小不能超过 10MB，建议使用清晰的图片以获得更好的识别效果。"
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        </div>
      )
    },
    {
      key: '3',
      label: '检测结果如何解读？',
      children: (
        <div>
          <Paragraph>
            <Text strong>总体评级：</Text>
          </Paragraph>
          <List
            size="small"
            dataSource={[
              { status: '合格', desc: '所有检测项目均符合标准要求' },
              { status: '基本合格', desc: '存在少量问题，但不影响基本合规性' },
              { status: '不合格', desc: '存在严重问题，需要立即整改' }
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text strong style={{ marginRight: '8px' }}>{item.status}：</Text>
                {item.desc}
              </List.Item>
            )}
          />
          <Paragraph>
            <Text strong>风险等级：</Text>
          </Paragraph>
          <List
            size="small"
            dataSource={[
              { level: '无风险', desc: '符合标准要求' },
              { level: '低风险', desc: '轻微不符合，建议改进' },
              { level: '中风险', desc: '明显不符合，需要整改' },
              { level: '高风险', desc: '严重不符合，必须立即整改' }
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text strong style={{ marginRight: '8px' }}>{item.level}：</Text>
                {item.desc}
              </List.Item>
            )}
          />
        </div>
      )
    },
    {
      key: '4',
      label: '如何导出检测报告？',
      children: (
        <div>
          <Paragraph>
            检测完成后，在结果页面底部点击"导出报告"按钮，系统将生成详细的检测报告。
          </Paragraph>
          <Paragraph>
            支持导出格式：
          </Paragraph>
          <List
            size="small"
            dataSource={[
              'PDF 格式（推荐）',
              'Excel 格式',
              'Word 格式'
            ]}
            renderItem={(item) => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                {item}
              </List.Item>
            )}
          />
        </div>
      )
    },
    {
      key: '5',
      label: '检测标准依据是什么？',
      children: (
        <div>
          <Paragraph>
            本系统基于以下国家标准进行检测：
          </Paragraph>
          <List
            size="small"
            dataSource={[
              'GB 7718-2025 食品安全国家标准 预包装食品标签通则',
              'GB 28050-2011 食品安全国家标准 预包装食品营养标签通则',
              'GB 13432-2013 食品安全国家标准 预包装特殊膳食用食品标签',
              '相关行业标准和法规要求'
            ]}
            renderItem={(item) => (
              <List.Item>
                <FileTextOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                {item}
              </List.Item>
            )}
          />
        </div>
      )
    }
  ]

  const contactInfo = [
    {
      title: '技术支持',
      content: '如有技术问题，请联系技术支持团队',
      email: 'support@foodsafety.com',
      phone: '400-123-4567'
    },
    {
      title: '业务咨询',
      content: '关于检测标准和业务相关问题',
      email: 'business@foodsafety.com', 
      phone: '400-123-4568'
    }
  ]

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 系统介绍 */}
          <div>
            <Title level={2}>
              <SafetyOutlined style={{ marginRight: '8px' }} />
              食品安全标签检测系统
            </Title>
            <Paragraph>
              本系统采用先进的OCR技术和人工智能算法，能够自动识别和分析食品包装标签信息，
              对照国家标准进行合规性检测，为食品生产企业、监管部门提供专业的标签检测服务。
            </Paragraph>
          </div>

          {/* 常见问题 */}
          <div>
            <Title level={3}>
              <QuestionCircleOutlined style={{ marginRight: '8px' }} />
              常见问题
            </Title>
            <Collapse defaultActiveKey={['1']}>
              {helpData.map(item => (
                <Panel header={item.label} key={item.key}>
                  {item.children}
                </Panel>
              ))}
            </Collapse>
          </div>

          {/* 联系信息 */}
          <div>
            <Title level={3}>
              <UploadOutlined style={{ marginRight: '8px' }} />
              联系我们
            </Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {contactInfo.map((info, index) => (
                <Card key={index} size="small">
                  <Title level={4}>{info.title}</Title>
                  <Paragraph>{info.content}</Paragraph>
                  <Paragraph>
                    <Text strong>邮箱：</Text>{info.email}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>电话：</Text>{info.phone}
                  </Paragraph>
                </Card>
              ))}
            </div>
          </div>

          {/* 免责声明 */}
          <Alert
            message="免责声明"
            description="本系统检测结果仅供参考，具体合规性判断请以相关法律法规和标准为准。"
            type="warning"
            showIcon
          />
        </Space>
      </Card>
    </div>
  )
}

export default HelpPage 