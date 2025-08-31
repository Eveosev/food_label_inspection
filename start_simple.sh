#!/bin/bash

echo "🚀 启动食品安全标签检测系统 - MVP版本..."

# 安装前端依赖
echo "📦 安装前端依赖..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "前端依赖已存在，跳过安装"
fi

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p uploads

# 启动简化版后端服务
echo "🔧 启动简化版后端服务..."
echo "✨ MVP功能："
echo "   - 图片上传"
echo "   - Dify API调用"
echo "   - 结果展示"
echo "   - 无数据库依赖"
python run_backend_simple.py &
BACKEND_PID=$!

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 启动前端服务
echo "🌐 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo "✅ MVP系统启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo "🧪 Dify测试: http://localhost:8000/api/test-dify"
echo ""
echo "🎯 MVP功能说明："
echo "   1. 上传图片文件"
echo "   2. 填写检测参数"
echo "   3. 调用Dify API获取检测结果"
echo "   4. 展示检测结果"
echo "   5. 无数据库存储（轻量级）"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
