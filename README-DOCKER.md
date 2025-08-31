# 食品安全标签检测系统 - Docker 部署指南

## 概述

本指南介绍如何使用 Docker 和 Docker Compose 部署完整的食品安全标签检测系统。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Nginx)  │    │   后端 (FastAPI) │    │  数据库 (PostgreSQL) │
│   端口: 80      │───▶│   端口: 8000     │───▶│   端口: 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                               ┌─────────────────┐
                                               │  缓存 (Redis)   │
                                               │   端口: 6379    │
                                               └─────────────────┘
```

## 服务组件

### 1. 前端服务 (Frontend)
- **镜像**: 基于 Node.js + Nginx
- **端口**: 80
- **功能**: 提供 React 用户界面

### 2. 后端服务 (Backend)
- **镜像**: 基于 Python 3.11
- **端口**: 8000
- **功能**: FastAPI 应用，提供检测 API

### 3. 数据库服务 (Database)
- **镜像**: PostgreSQL 15
- **端口**: 5432
- **功能**: 存储检测记录和用户数据

### 4. 缓存服务 (Redis)
- **镜像**: Redis 7
- **端口**: 6379
- **功能**: 缓存和会话管理

## 快速启动

### 前提条件
- Docker Engine 20.10+
- Docker Compose 2.0+

### 启动步骤

1. **使用启动脚本 (推荐)**
```bash
./docker-start.sh
```

2. **手动启动**
```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 访问地址
- 前端应用: http://localhost
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 数据库: localhost:5432 (postgres/password123)
- Redis: localhost:6379

## 管理命令

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 进入容器
```bash
# 进入后端容器
docker-compose exec backend bash

# 进入数据库容器
docker-compose exec database psql -U postgres -d food_safety
```

## 环境配置

### 数据库配置
- 数据库名: food_safety
- 用户名: postgres
- 密码: password123
- 端口: 5432

### 数据持久化
- PostgreSQL 数据: `postgres_data` 卷
- Redis 数据: `redis_data` 卷
- 上传文件: `./uploads` 目录
- 检测结果: `./results` 目录

## 生产环境配置

### 1. 环境变量
创建 `.env` 文件:
```env
# 数据库配置
POSTGRES_DB=food_safety
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# 应用配置
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# 安全配置
SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
```

### 2. 安全加固
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - DEBUG=false
      - SECRET_KEY=${SECRET_KEY}
    
  database:
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    # 不暴露端口到主机
    # ports: []
```

### 3. 反向代理 (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
    }
}
```

## 监控和日志

### 1. 健康检查
```bash
# 检查服务状态
docker-compose ps

# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' food-safety-backend
```

### 2. 日志管理
```bash
# 限制日志大小
docker-compose.yml 中添加:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 备份和恢复

### 数据库备份
```bash
# 备份数据库
docker-compose exec database pg_dump -U postgres food_safety > backup.sql

# 恢复数据库
docker-compose exec -T database psql -U postgres food_safety < backup.sql
```

### 文件备份
```bash
# 备份上传文件和结果
tar -czf files-backup.tar.gz uploads/ results/
```

## 故障排除

### 常见问题

1. **端口冲突**
```bash
# 检查端口占用
lsof -i :80
lsof -i :8000

# 修改 docker-compose.yml 中的端口映射
```

2. **内存不足**
```bash
# 检查 Docker 内存使用
docker stats

# 增加 Docker 内存限制
```

3. **构建失败**
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 调试模式
```bash
# 启动调试模式
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up
```

## 更新部署

### 滚动更新
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up --build -d

# 检查更新状态
docker-compose ps
```

### 零停机更新
```bash
# 使用蓝绿部署
docker-compose -f docker-compose.blue.yml up -d
# 切换流量
docker-compose -f docker-compose.green.yml down
```

## 性能优化

### 1. 镜像优化
- 使用多阶段构建减小镜像大小
- 使用 Alpine Linux 基础镜像
- 清理不必要的依赖

### 2. 资源限制
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 支持

如有问题，请参考：
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- 项目 GitHub Issues
