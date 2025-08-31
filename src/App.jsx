import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout, Menu, Breadcrumb, Avatar, Dropdown, Badge } from 'antd'
import { 
  HomeOutlined, 
  HistoryOutlined, 
  QuestionCircleOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import HelpPage from './pages/HelpPage'

const { Header, Sider, Content } = Layout

function App() {
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '检测记录',
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: '帮助',
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧导航栏 */}
      <Sider 
        width={200} 
        style={{ 
          background: '#1890ff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              background: 'white', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#1890ff' }}>🍃</span>
            </div>
            食品安全检测
          </div>
        </div>
        
        <Menu
          mode="inline"
          defaultSelectedKeys={['/']}
          style={{ 
            background: 'transparent',
            border: 'none'
          }}
          theme="dark"
          items={menuItems}
        />
      </Sider>

      <Layout>
        {/* 顶部导航栏 */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: '64px'
        }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>检测</Breadcrumb.Item>
          </Breadcrumb>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={3}>
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
            
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    console.log('用户退出登录')
                  }
                },
              }}
              placement="bottomRight"
            >
              <Avatar 
                icon={<UserOutlined />} 
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        </Header>

        {/* 主内容区域 */}
        <Layout style={{ padding: '24px' }}>
          <Content style={{ 
            background: '#fff', 
            padding: '24px',
            margin: 0,
            minHeight: 280,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App 