#!/bin/bash

# 本地构建并打包部署文件脚本
# 用于在 Mac 上构建 Docker 镜像并打包所有部署文件

set -e  # 遇到错误立即退出

echo "🚀 开始构建食品标签检测系统部署包..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 配置变量
IMAGE_NAME="food-label-inspection"
IMAGE_TAG="latest"
DEPLOY_DIR="deploy_package"
PACKAGE_NAME="food-label-inspection-deploy.tar.gz"

# 检查 Docker 环境
print_info "检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

print_success "Docker 环境检查通过"

# 清理旧的部署目录
print_info "清理旧的部署文件..."
rm -rf $DEPLOY_DIR
rm -f $PACKAGE_NAME
print_success "清理完成"

# 构建 Docker 镜像
print_info "开始构建 Docker 镜像..."
# 明确指定构建平台为 linux/amd64，确保在 Mac 上构建的镜像能在 Linux 服务器上运行
docker build --platform linux/amd64 -t $IMAGE_NAME:$IMAGE_TAG .
if [[ $? -eq 0 ]]; then
    print_success "Docker 镜像构建成功"
else
    print_error "Docker 镜像构建失败"
    exit 1
fi

# 导出 Docker 镜像
print_info "导出 Docker 镜像..."
docker save -o ${IMAGE_NAME}.tar $IMAGE_NAME:$IMAGE_TAG
if [[ $? -eq 0 ]]; then
    print_success "Docker 镜像导出成功"
else
    print_error "Docker 镜像导出失败"
    exit 1
fi

# 创建部署目录
print_info "创建部署目录..."
mkdir -p $DEPLOY_DIR

# 复制必要的部署文件
print_info "复制部署文件..."
cp ${IMAGE_NAME}.tar $DEPLOY_DIR/
cp docker-compose.prod.yml $DEPLOY_DIR/docker-compose.prod.yml
cp deploy_on_server.sh $DEPLOY_DIR/
cp README_DEPLOY.md $DEPLOY_DIR/

# 复制docker配置文件
mkdir -p $DEPLOY_DIR/docker
cp docker/nginx.conf $DEPLOY_DIR/docker/
cp docker/supervisord.conf $DEPLOY_DIR/docker/

# 创建必要的目录结构
mkdir -p $DEPLOY_DIR/uploads
mkdir -p $DEPLOY_DIR/results

# 设置脚本权限
chmod +x $DEPLOY_DIR/deploy_on_server.sh

print_success "部署文件复制完成"

# 打包部署文件
print_info "打包部署文件..."
tar -czf $PACKAGE_NAME $DEPLOY_DIR/
if [[ $? -eq 0 ]]; then
    print_success "部署包创建成功: $PACKAGE_NAME"
else
    print_error "部署包创建失败"
    exit 1
fi

# 清理临时文件
print_info "清理临时文件..."
rm -f ${IMAGE_NAME}.tar
rm -rf $DEPLOY_DIR

# 显示部署包信息
PACKAGE_SIZE=$(du -h $PACKAGE_NAME | cut -f1)
print_success "🎉 构建完成！"
echo ""
print_info "部署包信息:"
echo "  文件名: $PACKAGE_NAME"
echo "  大小: $PACKAGE_SIZE"
echo ""
print_info "部署步骤:"
echo "  1. 将 $PACKAGE_NAME 上传到服务器"
echo "  2. 在服务器上解压: tar -xzf $PACKAGE_NAME"
echo "  3. 进入目录: cd $DEPLOY_DIR"
echo "  4. 运行部署脚本: ./deploy_on_server.sh"
echo ""
print_warning "注意: 请确保服务器已安装 Docker 和 Docker Compose"
