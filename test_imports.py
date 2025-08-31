#!/usr/bin/env python3
"""
测试导入是否正常工作
"""
import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

def test_imports():
    """测试所有关键模块的导入"""
    try:
        print("🔍 开始测试模块导入...")
        
        # 测试基础模块
        print("📦 测试基础模块...")
        import backend
        print("✅ backend模块导入成功")
        
        # 测试models模块
        print("📦 测试models模块...")
        from backend.models import DetectionRecord, UploadedFile, User, DetectionHistory
        print("✅ models模块导入成功")
        
        # 测试database模块
        print("📦 测试database模块...")
        from backend.database import init_database, close_database, get_database
        print("✅ database模块导入成功")
        
        # 测试main模块（这个可能会因为依赖问题失败，但我们能看到具体错误）
        print("📦 测试main模块...")
        try:
            from backend.main import app
            print("✅ main模块导入成功")
        except ImportError as e:
            print(f"⚠️  main模块导入失败（可能缺少依赖）: {e}")
            return False
        
        print("🎉 所有核心模块导入测试通过！")
        return True
        
    except Exception as e:
        print(f"❌ 导入测试失败: {e}")
        import traceback
        print(f"详细错误信息: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("🚀 开始导入测试...")
    print(f"📁 项目根目录: {project_root}")
    print(f"🐍 Python路径: {sys.path[:3]}...")
    print("-" * 50)
    
    success = test_imports()
    
    print("-" * 50)
    if success:
        print("✅ 导入测试成功！相对导入问题已解决。")
        sys.exit(0)
    else:
        print("❌ 导入测试失败，请检查依赖安装或其他问题。")
        sys.exit(1)
