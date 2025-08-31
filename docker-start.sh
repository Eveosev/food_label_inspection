#!/bin/bash

echo "🐳 启动食品安全标签检测系统 Docker 容器..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p uploads results

# 停止并删除现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 构建并启动服务
echo "🔧 构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

echo "✅ 系统启动完成！"
echo "📱 前端地址: http://localhost"
echo "🔧 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo "🗄️  数据库: localhost:5432 (用户名: postgres, 密码: password123)"
echo "🔄 Redis: localhost:6379"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
