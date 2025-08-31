#!/bin/bash

echo "�� 食品安全标签检测系统 - 生产环境部署"
echo "=========================================="

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

echo "✅ 环境检查通过"

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p uploads results logs

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml down

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 启动服务
echo "🚀 启动生产环境服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 检查健康状态
echo "🏥 检查服务健康状态..."
sleep 10

echo ""
echo "✅ 部署完成！"
echo "=========================================="
echo "📱 前端地址: http://localhost"
echo "🔧 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo "🔄 Redis: localhost:6379"
echo ""
echo "📋 管理命令:"
echo "  查看状态: docker-compose -f docker-compose.prod.yml ps"
echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "📁 数据目录:"
echo "  上传文件: ./uploads"
echo "  检测结果: ./results"
echo "  日志文件: ./logs"
