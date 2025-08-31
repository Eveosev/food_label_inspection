.PHONY: help build up down restart logs clean dev docker-build docker-up docker-down

# Default target
help:
@echo "食品安全标签检测系统 - 可用命令："
@echo ""
@echo "开发环境:"
@echo "  make dev          启动开发环境 (本地)"
@echo "  make install      安装依赖"
@echo ""
@echo "Docker环境:"
@echo "  make docker-up    启动Docker容器"
@echo "  make docker-down  停止Docker容器"
@echo "  make docker-logs  查看Docker日志"
@echo "  make docker-build 重新构建Docker镜像"
@echo ""
@echo "管理命令:"
@echo "  make clean        清理临时文件"
@echo "  make backup       备份数据"
@echo "  make restore      恢复数据"

# 开发环境
install:
@echo "📦 安装前端依赖..."
npm install
@echo "📦 安装后端依赖..."
pip3 install -r requirements.txt

dev:
@echo "🚀 启动开发环境..."
./start.sh

# Docker环境
docker-build:
@echo "🔨 构建Docker镜像..."
docker-compose build

docker-up:
@echo "🐳 启动Docker容器..."
./docker-start.sh

docker-down:
@echo "🛑 停止Docker容器..."
docker-compose down

docker-restart:
@echo "🔄 重启Docker容器..."
docker-compose restart

docker-logs:
@echo "📋 查看Docker日志..."
docker-compose logs -f

# 数据管理
backup:
@echo "💾 备份数据..."
@mkdir -p backups
@if [ $$(docker-compose ps -q database) ]; then \
food_safety > backups/db_backup_$$(date +%Y%m%d_%H%M%S).sql; \
echo "数据库备份完成"; \
fi
@if [ -d "uploads" ]; then \
tar -czf backups/files_backup_$$(date +%Y%m%d_%H%M%S).tar.gz uploads/ results/; \
echo "文件备份完成"; \
fi

restore:
@echo "🔄 恢复数据..."
@echo "请手动指定备份文件进行恢复"

# 清理
clean:
@echo "🧹 清理临时文件..."
@rm -rf node_modules/.cache
@rm -rf __pycache__
@rm -rf .pytest_cache
@docker system prune -f
@echo "清理完成"

# 测试
test:
@echo "🧪 运行测试..."
@echo "前端测试..."
npm test
@echo "后端测试..."
cd backend && python -m pytest

# 部署
deploy-prod:
@echo "🚀 生产环境部署..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 健康检查
health:
@echo "🏥 检查服务健康状态..."
@if [ $$(docker-compose ps -q) ]; then \
docker-compose ps; \
echo ""; \
echo "服务状态检查:"; \
curl -f http://localhost:8000/health || echo "后端服务异常"; \
curl -f http://localhost/ || echo "前端服务异常"; \
else \
echo "Docker容器未运行"; \
fi
