#!/bin/bash

echo "🚀 启动食品安全标签检测系统..."
# 安装前端依赖
echo "📦 安装前端依赖..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "前端依赖已存在，跳过安装"
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
pip3 install -r requirements.txt

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p backend/uploads
mkdir -p backend/results

# 启动后端服务
echo "🔧 启动后端服务..."
# 使用专门的Python脚本启动，避免相对导入问题
python run_backend.py &
BACKEND_PID=$!

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 启动前端服务
echo "🌐 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo "✅ 系统启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 