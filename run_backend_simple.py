#!/usr/bin/env python3
"""
简化版后端服务启动脚本 - MVP版本
仅包含核心功能：上传图片、调用Dify API、展示结果
"""

import sys
import os
import uvicorn

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

if __name__ == "__main__":
    # 创建必要的目录
    os.makedirs("uploads", exist_ok=True)
    
    print("🚀 启动食品安全标签检测系统后端服务 - MVP版本...")
    print(f"📁 项目根目录: {project_root}")
    print("✨ 简化版本特性:")
    print("   - 图片上传")
    print("   - Dify API调用")
    print("   - 结果展示")
    print("   - 无数据库依赖")
    print("-" * 50)
    
    # 测试简化版导入
    try:
        print("🔍 测试简化版模块导入...")
        from backend.main_simple import app
        print("✅ 成功导入简化版 backend.main_simple")
        
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请检查依赖安装")
        sys.exit(1)
    
    print("✅ 所有模块导入成功，启动服务器...")
    print("-" * 50)
    
    # 启动uvicorn服务器
    uvicorn.run(
        "backend.main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
