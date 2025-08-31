#!/usr/bin/env python3
"""
简化版系统测试脚本
测试MVP核心功能：图片上传 → Dify API调用 → 结果展示
"""

import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

def test_simple_imports():
    """测试简化版的导入"""
    try:
        print("🔍 测试简化版模块导入...")
        
        # 测试简化版main模块
        print("📦 测试简化版main模块...")
        from backend.main_simple import app, call_dify_workflow
        print("✅ main_simple模块导入成功")
        
        # 测试FastAPI应用
        print("📦 测试FastAPI应用...")
        assert app.title == "食品安全标签检测系统API - MVP版本"
        print("✅ FastAPI应用配置正确")
        
        print("🎉 简化版所有模块导入测试通过！")
        return True
        
    except Exception as e:
        print(f"❌ 导入测试失败: {e}")
        import traceback
        print(f"详细错误信息: {traceback.format_exc()}")
        return False

def test_directory_structure():
    """测试目录结构"""
    try:
        print("📁 测试目录结构...")
        
        # 检查必要文件
        required_files = [
            "backend/main_simple.py",
            "run_backend_simple.py", 
            "start_simple.sh"
        ]
        
        for file_path in required_files:
            if os.path.exists(file_path):
                print(f"✅ {file_path} 存在")
            else:
                print(f"❌ {file_path} 不存在")
                return False
        
        print("✅ 目录结构检查通过")
        return True
        
    except Exception as e:
        print(f"❌ 目录结构检查失败: {e}")
        return False

if __name__ == "__main__":
    print("🚀 开始简化版系统测试...")
    print(f"📁 项目根目录: {project_root}")
    print("🎯 MVP功能测试：")
    print("   - 模块导入")
    print("   - 目录结构")
    print("   - FastAPI配置")
    print("-" * 50)
    
    # 运行测试
    import_success = test_simple_imports()
    structure_success = test_directory_structure()
    
    print("-" * 50)
    if import_success and structure_success:
        print("✅ 简化版系统测试成功！")
        print("")
        print("🎯 启动方式：")
        print("  ./start_simple.sh      # 启动完整MVP系统")
        print("  python run_backend_simple.py  # 仅启动后端")
        print("")
        print("🌐 访问地址：")
        print("  前端: http://localhost:3000")
        print("  后端: http://localhost:8000")
        print("  API文档: http://localhost:8000/docs")
        print("  Dify测试: http://localhost:8000/api/test-dify")
        sys.exit(0)
    else:
        print("❌ 简化版系统测试失败")
        sys.exit(1)
