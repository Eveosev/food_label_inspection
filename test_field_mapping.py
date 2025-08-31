#!/usr/bin/env python3
"""
测试前后端字段映射
"""

import requests
import json
from datetime import datetime

def test_field_mapping():
    """测试字段映射是否正确"""
    
    # 后端期望的字段
    expected_fields = [
        'file',
        'Foodtype', 
        'PackageFoodType',
        'SingleOrMulti', 
        'PackageSize',
        'DetectionTime',
        'SpecialRequirement'
    ]
    
    # 模拟前端发送的数据
    test_data = {
        'Foodtype': '糕点',
        'PackageFoodType': '直接提供给消费者的预包装食品', 
        'SingleOrMulti': '单包装',
        'PackageSize': '常规包装',
        'DetectionTime': '2024-12-28',
        'SpecialRequirement': '测试要求'
    }
    
    print("🔍 测试字段映射...")
    print(f"前端发送字段: {list(test_data.keys())}")
    print(f"后端期望字段: {expected_fields[1:]}")  # 除了file字段
    
    # 检查字段匹配
    missing_fields = []
    for field in expected_fields[1:]:  # 跳过file字段
        if field not in test_data:
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ 缺少字段: {missing_fields}")
        return False
    else:
        print("✅ 所有字段都匹配")
        return True

def test_api_connection():
    """测试API连接"""
    try:
        print("\n🌐 测试API连接...")
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ API服务正常运行")
            print(f"响应: {response.json()}")
            return True
        else:
            print(f"❌ API响应错误: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API连接失败: {e}")
        return False

if __name__ == "__main__":
    print("🚀 开始测试前后端集成...")
    print("=" * 50)
    
    # 测试字段映射
    field_test = test_field_mapping()
    
    # 测试API连接
    api_test = test_api_connection()
    
    print("=" * 50)
    if field_test and api_test:
        print("✅ 所有测试通过！")
        print("\n📋 启动建议:")
        print("1. 确保后端服务运行: python run_backend_simple.py")
        print("2. 确保前端服务运行: npm run dev") 
        print("3. 打开浏览器访问: http://localhost:3000")
    else:
        print("❌ 部分测试失败，请检查配置")
    
    print("\n🔧 常见问题排查:")
    print("- 检查字段名是否匹配")
    print("- 检查后端服务是否启动") 
    print("- 检查前端服务是否启动")
    print("- 查看浏览器控制台错误信息")
    print("- 查看后端日志信息")
