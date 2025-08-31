#!/bin/bash

echo "🔨 开始构建Docker镜像..."

# 构建前端镜像
echo "📦 构建前端镜像..."
docker build -f docker/frontend.Dockerfile -t food-safety-frontend:latest .

# 构建后端镜像
echo "📦 构建后端镜像..."
docker build -f docker/backend.Dockerfile -t food-safety-backend:latest .

echo "✅ 镜像构建完成！"
echo ""
echo "📋 可用镜像:"
docker images | grep food-safety
