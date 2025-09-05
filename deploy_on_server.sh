#!/bin/bash

# 服务器端部署脚本
# 用于在阿里云CentOS服务器上部署食品标签检测系统

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
IMAGE_NAME="food-label-inspection"
IMAGE_TAG="latest"
CONTAINER_NAME="food-label-app"
COMPOSE_FILE="docker-compose.prod.yml"

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root用户或sudo权限运行此脚本"
        exit 1
    fi
}

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker安装状态..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        log_info "安装命令: yum install -y docker-ce docker-ce-cli containerd.io"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! systemctl is-active --quiet docker; then
        log_warning "Docker服务未启动，正在启动..."
        systemctl start docker
        systemctl enable docker
    fi
    
    log_success "Docker已安装并运行"
}

# 检查Docker Compose是否安装
check_docker_compose() {
    log_info "检查Docker Compose安装状态..."
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装"
        log_info "安装命令: curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        log_info "然后执行: chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    log_success "Docker Compose已安装"
}

# 停止现有容器
stop_existing_containers() {
    log_info "停止现有容器..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true
    fi
    
    # 强制停止并删除同名容器
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warning "发现同名容器，正在停止并删除..."
        docker stop "$CONTAINER_NAME" || true
        docker rm "$CONTAINER_NAME" || true
    fi
    
    log_success "现有容器已停止"
}

# 清理旧镜像
cleanup_old_images() {
    log_info "清理旧镜像..."
    
    # 删除同名镜像
    if docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:${IMAGE_TAG}$"; then
        log_warning "发现同名镜像，正在删除..."
        docker rmi "${IMAGE_NAME}:${IMAGE_TAG}" || true
    fi
    
    # 清理悬空镜像
    docker image prune -f || true
    
    log_success "旧镜像清理完成"
}

# 加载Docker镜像
load_docker_image() {
    log_info "加载Docker镜像..."
    
    IMAGE_FILE="${IMAGE_NAME}.tar"
    
    if [ ! -f "$IMAGE_FILE" ]; then
        log_error "Docker镜像文件不存在: $IMAGE_FILE"
        log_error "请确保部署包中包含镜像文件"
        exit 1
    fi
    
    log_info "正在加载镜像文件: $IMAGE_FILE"
    docker load -i "$IMAGE_FILE"
    
    # 验证镜像是否加载成功
    if docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:${IMAGE_TAG}$"; then
        log_success "Docker镜像加载成功"
    else
        log_error "Docker镜像加载失败"
        exit 1
    fi
}

# 检查配置文件
check_config_files() {
    log_info "检查配置文件..."
    
    required_files=(
        "$COMPOSE_FILE"
        "docker/nginx.conf"
        "docker/supervisord.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "配置文件不存在: $file"
            exit 1
        fi
    done
    
    log_success "配置文件检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    directories=(
        "uploads"
        "logs"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "创建目录: $dir"
        fi
    done
    
    # 设置目录权限
    chmod 755 uploads logs
    
    log_success "目录创建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 使用docker-compose启动服务
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 10
    
    # 检查容器状态
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "容器运行正常"
    else
        log_error "容器启动失败"
        log_info "查看容器日志:"
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
    
    # 检查端口监听
    if netstat -tlnp | grep -q ":8011"; then
        log_success "端口8011监听正常"
    else
        log_warning "端口8011未监听，可能需要等待更长时间"
    fi
    
    # 尝试HTTP健康检查
    log_info "尝试HTTP健康检查..."
    for i in {1..5}; do
        if curl -f -s http://localhost:8011/ > /dev/null 2>&1; then
            log_success "HTTP健康检查通过"
            break
        else
            log_warning "HTTP健康检查失败，等待重试... ($i/5)"
            sleep 5
        fi
        
        if [ $i -eq 5 ]; then
            log_warning "HTTP健康检查失败，但服务可能仍在启动中"
        fi
    done
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo
    echo "=== 部署信息 ==="
    echo "应用名称: 食品标签检测系统"
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):8011"
    echo "容器名称: $CONTAINER_NAME"
    echo "镜像版本: $IMAGE_NAME:$IMAGE_TAG"
    echo
    echo "=== 管理命令 ==="
    echo "查看服务状态: docker-compose -f $COMPOSE_FILE ps"
    echo "查看服务日志: docker-compose -f $COMPOSE_FILE logs -f"
    echo "停止服务: docker-compose -f $COMPOSE_FILE down"
    echo "重启服务: docker-compose -f $COMPOSE_FILE restart"
    echo
    echo "=== 系统监控 ==="
    echo "CPU使用率: top"
    echo "内存使用: free -h"
    echo "磁盘使用: df -h"
    echo "网络连接: netstat -tlnp | grep 8011"
    echo
}

# 主函数
main() {
    log_info "开始部署食品标签检测系统..."
    log_info "部署时间: $(date)"
    echo
    
    # 执行部署步骤
    check_root
    check_docker
    check_docker_compose
    stop_existing_containers
    cleanup_old_images
    load_docker_image
    check_config_files
    create_directories
    start_services
    health_check
    show_deployment_info
    
    log_success "部署流程完成！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
