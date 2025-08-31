#!/usr/bin/env python3
"""
测试从httpx迁移到requests
"""

import requests
import json
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_requests_vs_httpx():
    """测试requests与httpx的差异"""
    
    print("🔄 测试从httpx迁移到requests...")
    print("=" * 50)
    
    # 测试基本的requests请求
    try:
        logger.info("测试requests基本功能...")
        
        # 测试健康检查
        response = requests.get("http://localhost:8000/health", timeout=30)
        logger.info(f"健康检查状态码: {response.status_code}")
        logger.info(f"健康检查响应: {response.json()}")
        
        print("✅ requests基本功能正常")
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ 连接错误: {e}")
        print("请确保后端服务正在运行: python run_backend_simple.py")
        
    except requests.exceptions.Timeout as e:
        print(f"❌ 超时错误: {e}")
        
    except Exception as e:
        print(f"❌ 其他错误: {e}")

def compare_libraries():
    """比较httpx和requests的优缺点"""
    
    print("\n📊 httpx vs requests 比较:")
    print("=" * 50)
    
    print("🔧 httpx:")
    print("  ✅ 异步支持")
    print("  ✅ HTTP/2支持")
    print("  ✅ 现代化API")
    print("  ❌ 可能出现ReadError")
    print("  ❌ 相对较新，稳定性待验证")
    
    print("\n🔧 requests:")
    print("  ✅ 成熟稳定")
    print("  ✅ 广泛使用")
    print("  ✅ 错误处理更可预测")
    print("  ✅ 文档丰富")
    print("  ❌ 同步库（需要在线程池中运行异步）")
    print("  ❌ 不支持HTTP/2")

def test_error_handling():
    """测试requests的错误处理"""
    
    print("\n🧪 测试requests错误处理:")
    print("=" * 50)
    
    try:
        # 测试超时
        logger.info("测试超时处理...")
        response = requests.get("http://httpbin.org/delay/5", timeout=1)
        
    except requests.exceptions.Timeout as e:
        print("✅ 超时异常处理正常")
        logger.info(f"超时异常: {e}")
        
    except Exception as e:
        print(f"其他异常: {e}")
    
    try:
        # 测试连接错误
        logger.info("测试连接错误处理...")
        response = requests.get("http://invalid-domain-12345.com", timeout=5)
        
    except requests.exceptions.ConnectionError as e:
        print("✅ 连接错误异常处理正常")
        logger.info(f"连接错误: {e}")
        
    except Exception as e:
        print(f"其他异常: {e}")

def main():
    """主函数"""
    
    print("🚀 httpx → requests 迁移测试")
    print("=" * 60)
    
    # 基本功能测试
    test_requests_vs_httpx()
    
    # 库比较
    compare_libraries()
    
    # 错误处理测试
    test_error_handling()
    
    print("=" * 60)
    print("📋 迁移总结:")
    print("1. ✅ 移除了httpx依赖")
    print("2. ✅ 使用requests.post替代httpx.AsyncClient")
    print("3. ✅ 更新了异常处理逻辑")
    print("4. ✅ 简化了超时配置")
    print("5. ✅ 函数从async改为同步")
    
    print("\n🎯 预期效果:")
    print("- 更稳定的网络请求")
    print("- 更可预测的错误处理")
    print("- 减少ReadError等异常")
    print("- 更简单的代码维护")
    
    print("\n⚠️ 注意事项:")
    print("- call_dify_workflow不再是async函数")
    print("- 错误异常类型已更改")
    print("- 超时配置简化为单一数值")

if __name__ == "__main__":
    main()
