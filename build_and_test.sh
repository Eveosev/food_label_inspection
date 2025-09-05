#!/bin/bash

# 食品标签检测系统 Docker 构建和测试脚本

set -e  # 遇到错误立即退出

echo "🚀 开始构建和测试食品标签检测系统..."

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

# 检查 Docker 和 Docker Compose
print_info "检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

print_success "Docker 环境检查通过"

# 检查必要文件
print_info "检查必要文件..."
required_files=(
    "Dockerfile"
    "docker-compose.yml"
    "docker/nginx.conf"
    "docker/supervisord.conf"
    "start_simple_docker.sh"
    "package.json"
    "requirements.txt"
    "backend/main_simple_fixed.py"
    "run_backend_simple.py"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "缺少必要文件: $file"
        exit 1
    fi
done

print_success "必要文件检查通过"

# 创建必要目录
print_info "创建必要目录..."
mkdir -p uploads results
print_success "目录创建完成"

# 设置脚本权限
print_info "设置脚本权限..."
chmod +x start_simple_docker.sh
print_success "权限设置完成"

# 停止现有容器（如果存在）
print_info "停止现有容器..."
docker-compose down 2>/dev/null || true
print_success "现有容器已停止"

# 构建镜像
print_info "开始构建 Docker 镜像..."
docker-compose build --no-cache
if [[ $? -eq 0 ]]; then
    print_success "Docker 镜像构建成功"
else
    print_error "Docker 镜像构建失败"
    exit 1
fi

# 启动服务
print_info "启动服务..."
docker-compose up -d
if [[ $? -eq 0 ]]; then
    print_success "服务启动成功"
else
    print_error "服务启动失败"
    exit 1
fi

# 等待服务启动
print_info "等待服务启动完成..."
sleep 30

# 检查容器状态
print_info "检查容器状态..."
docker-compose ps

# 健康检查
print_info "执行健康检查..."

# 检查前端
print_info "检查前端服务 (端口 8011)..."
for i in {1..10}; do
    if curl -f http://localhost:8011/health &>/dev/null; then
        print_success "前端服务健康检查通过"
        break
    else
        if [[ $i -eq 10 ]]; then
            print_error "前端服务健康检查失败"
            print_info "查看前端日志:"
            docker-compose logs food-label-app | tail -20
        else
            print_warning "前端服务未就绪，等待 5 秒后重试... ($i/10)"
            sleep 5
        fi
    fi
done

# 检查后端
print_info "检查后端服务 (端口 8000)..."
for i in {1..10}; do
    if curl -f http://localhost:8000/health &>/dev/null; then
        print_success "后端服务健康检查通过"
        break
    else
        if [[ $i -eq 10 ]]; then
            print_error "后端服务健康检查失败"
            print_info "查看后端日志:"
            docker-compose logs food-label-app | tail -20
        else
            print_warning "后端服务未就绪，等待 5 秒后重试... ($i/10)"
            sleep 5
        fi
    fi
done

# 测试 API 端点
print_info "测试 API 端点..."
if curl -f http://localhost:8000/ &>/dev/null; then
    print_success "API 根端点测试通过"
else
    print_warning "API 根端点测试失败"
fi

# 显示访问信息
echo ""
print_success "🎉 部署完成！"
echo ""
print_info "访问地址:"
echo "  前端应用: http://localhost:8011"
echo "  后端API:  http://localhost:8000"
echo "  API文档:  http://localhost:8000/docs"
echo "  健康检查: http://localhost:8011/health"
echo ""
print_info "管理命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
print_info "如需停止服务，请运行: docker-compose down"
