#!/bin/bash

# 构建Docker镜像脚本

echo "🐳 构建食品安全标签检测系统Docker镜像..."

# 设置镜像名称和标签
IMAGE_NAME="food-safety-detection"
TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "📦 镜像名称: ${FULL_IMAGE_NAME}"

# 构建Docker镜像
echo "🔨 开始构建Docker镜像..."
docker build --platform linux/amd64 -t ${FULL_IMAGE_NAME} . 

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功！"
    echo "📋 镜像信息:"
    docker images | grep ${IMAGE_NAME}
    
    echo ""
    echo "🚀 部署命令:"
    echo "docker run -d --name food-safety-app -p 8017:8017 ${FULL_IMAGE_NAME}"
    
    echo ""
    echo "🔍 查看运行状态:"
    echo "docker ps | grep food-safety-app"
    
    echo ""
    echo "📝 查看日志:"
    echo "docker logs food-safety-app"
    
    echo ""
    echo "🛑 停止服务:"
    echo "docker stop food-safety-app"
    
    echo ""
    echo "🗑️ 删除容器:"
    echo "docker rm food-safety-app"
    
    echo ""
    echo "📤 导出镜像:"
    echo "docker save ${FULL_IMAGE_NAME} | gzip > food-safety-detection.tar.gz"
    
    echo ""
    echo "📥 导入镜像:"
    echo "docker load < food-safety-detection.tar.gz"
    
else
    echo "❌ Docker镜像构建失败！"
    exit 1
fi
