#!/bin/bash

echo "🚀 启动食品安全标签检测系统 - Docker版本..."

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p uploads results

# 启动简化版后端服务（端口8017）
echo "🔧 启动简化版后端服务..."
echo "✨ MVP功能："
echo "   - 图片上传"
echo "   - Dify API调用"
echo "   - 结果展示"
echo "   - 无数据库依赖"
echo "   - 端口: 8017"

# 修改后端启动脚本，使用8017端口
python -c "
import sys
import os
import uvicorn

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.abspath('.'))
sys.path.insert(0, project_root)

# 创建必要的目录
os.makedirs('uploads', exist_ok=True)
os.makedirs('results', exist_ok=True)

print('🚀 启动食品安全标签检测系统后端服务 - Docker版本...')
print('📁 项目根目录:', project_root)
print('✨ 简化版本特性:')
print('   - 图片上传')
print('   - Dify API调用')
print('   - 结果展示')
print('   - 无数据库依赖')
print('   - 端口: 8017')
print('-' * 50)

# 测试简化版导入
try:
    print('🔍 测试简化版模块导入...')
    from backend.main_simple import app
    print('✅ 成功导入简化版 backend.main_simple')
except ImportError as e:
    print(f'❌ 导入错误: {e}')
    print('请检查依赖安装')
    sys.exit(1)

print('✅ 所有模块导入成功，启动服务器...')
print('-' * 50)

# 启动uvicorn服务器，使用8017端口
uvicorn.run(
    'backend.main_simple:app',
    host='0.0.0.0',
    port=8017,
    reload=False,
    log_level='info'
)
" &

BACKEND_PID=$!

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端服务是否启动成功
echo "🔍 检查后端服务状态..."
for i in {1..10}; do
    if curl -f http://localhost:8017/docs > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功！"
        break
    else
        echo "⏳ 等待后端服务启动... ($i/10)"
        sleep 2
    fi
done

echo "✅ Docker系统启动完成！"
echo "🔧 后端地址: http://localhost:8017"
echo "📚 API文档: http://localhost:8017/docs"
echo "🧪 Dify测试: http://localhost:8017/api/test-dify"
echo ""
echo "🎯 MVP功能说明："
echo "   1. 上传图片文件"
echo "   2. 填写检测参数"
echo "   3. 调用Dify API获取检测结果"
echo "   4. 展示检测结果"
echo "   5. 无数据库存储（轻量级）"
echo ""
echo "📦 Docker容器运行中，按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID; exit" INT
wait
