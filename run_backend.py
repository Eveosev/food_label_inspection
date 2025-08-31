#!/usr/bin/env python3
"""
后端服务启动脚本
解决相对导入问题
"""

import sys
import os
import uvicorn

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

if __name__ == "__main__":
    # 创建必要的目录
    os.makedirs("backend/uploads", exist_ok=True)
    os.makedirs("backend/results", exist_ok=True)
    
    print("🚀 启动食品安全标签检测系统后端服务...")
    print(f"📁 项目根目录: {project_root}")
    print(f"🐍 Python路径: {sys.path[:3]}...")
    
    # 测试导入
    try:
        print("🔍 测试导入模块...")
        from backend.main import app
        print("✅ 成功导入 backend.main")
        
        from backend.database import init_database
        print("✅ 成功导入 backend.database")
        
        from backend.models import DetectionRecord
        print("✅ 成功导入 backend.models")
        
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请检查模块路径和依赖") 
    
    # 启动uvicorn服务器
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
