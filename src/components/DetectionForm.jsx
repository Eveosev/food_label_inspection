import React from 'react'
import { Form, Select, DatePicker, Checkbox, Button, Row, Col, Input } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input

const DetectionForm = ({ form, onFinish, isDetecting }) => {
  const foodTypeOptions = [
    { label: '糕点', value: '糕点' },
    { label: '饮料', value: '饮料' },
    { label: '零食', value: '零食' },
    { label: '乳制品', value: '乳制品' },
    { label: '肉类', value: '肉类' },
    { label: '其他', value: '其他' }
  ]

  const packageFoodTypeOptions = [
    { label: '直接提供给消费者的预包装食品', value: '直接提供给消费者的预包装食品' },
    { label: '餐饮服务', value: '餐饮服务' },
    { label: '其他', value: '其他' }
  ]

  const singleOrMultiOptions = [
    { label: '单件', value: '单件' },
    { label: '多件', value: '多件' }
  ]

  const packageSizeOptions = [
    { label: '最大表面面积大于35cm2', value: '最大表面面积大于35cm2' },
    { label: '最大表面面积小于等于35cm2', value: '最大表面面积小于等于35cm2' }
  ]

  const specialRequirementsOptions = [
    { label: '包含致敏物质', value: '包含致敏物质' },
    { label: '进口食品', value: '进口食品' },
    { label: '有机食品', value: '有机食品' },
    { label: '无糖食品', value: '无糖食品' }
  ]

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        检测时间: dayjs(),
        Foodtype: '糕点',
        PackageFoodType: '直接提供给消费者的预包装食品',
        SingleOrMulti: '多件',
        PackageSize: '最大表面面积大于35cm2'
      }}
    >
      <Row gutter={24}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="Foodtype"
            label="食品类型"
            rules={[{ required: true, message: '请选择食品类型' }]}
          >
            <Select
              placeholder="请选择食品类型"
              options={foodTypeOptions}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="PackageFoodType"
            label="包装食品类型"
            rules={[{ required: true, message: '请选择包装食品类型' }]}
          >
            <Select
              placeholder="请选择包装食品类型"
              options={packageFoodTypeOptions}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="SingleOrMulti"
            label="单件/多件"
            rules={[{ required: true, message: '请选择单件/多件' }]}
          >
            <Select
              placeholder="请选择单件/多件"
              options={singleOrMultiOptions}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="PackageSize"
            label="包装尺寸"
            rules={[{ required: true, message: '请选择包装尺寸' }]}
          >
            <Select
              placeholder="请选择包装尺寸"
              options={packageSizeOptions}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} sm={12} md={12}>
          <Form.Item
            name="DetectionTime"
            label="检测时间"
            rules={[{ required: true, message: '请选择检测时间' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择检测时间"
            />
          </Form.Item>
        </Col>
        
        <Col span={24}>
          <Form.Item
            name="SpecialRequirement"
            label="特殊要求"
          >
            <TextArea rows={3} placeholder="请输入特殊要求或注意事项" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={isDetecting}
          icon={<PlayCircleOutlined />}
          style={{
            height: '48px',
            padding: '0 32px',
            fontSize: '16px',
            background: '#52c41a',
            borderColor: '#52c41a'
          }}
        >
          {isDetecting ? '检测中...' : '开始智能检测'}
        </Button>
      </Form.Item>
    </Form>
  )
}

export default DetectionForm 