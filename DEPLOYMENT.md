# 食品标签检测系统 Docker 部署指南

## 项目概述

这是一个基于 FastAPI + React 的食品标签检测系统，使用 Dify API 进行 AI 分析。

## 部署架构

- **前端**: React + Vite + Ant Design (端口 8011)
- **后端**: FastAPI + Python (端口 8000)
- **Web服务器**: Nginx (反向代理和静态文件服务)
- **进程管理**: Supervisor
- **容器化**: Docker + Docker Compose
- **加速优化**: 使用中国源 (阿里云 apt 源、清华 pip 源、npmmirror npm 源)

## 快速部署

### 1. 使用 Docker Compose (推荐)

```bash
# 构建并启动服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 2. 使用 Docker 命令

```bash
# 构建镜像
docker build -t food-label-inspection .

# 运行容器
docker run -d \
  --name food-label-app \
  -p 8011:8011 \
  -p 8000:8000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/results:/app/results \
  food-label-inspection

# 查看容器状态
docker ps

# 查看日志
docker logs -f food-label-app

# 停止容器
docker stop food-label-app
docker rm food-label-app
```

## 访问应用

部署成功后，可以通过以下地址访问：

- **前端应用**: http://localhost:8011
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8011/health

## 端口说明

- **8011**: 前端应用端口 (Nginx)
- **8000**: 后端API端口 (FastAPI)

## 目录结构

```
food_label_inspection/
├── Dockerfile                 # Docker构建文件
├── docker-compose.yml         # Docker Compose配置
├── start_simple_docker.sh     # Docker启动脚本
├── docker/
│   ├── nginx.conf            # Nginx配置
│   └── supervisord.conf      # Supervisor配置
├── backend/                  # 后端代码
├── src/                      # 前端代码
├── uploads/                  # 文件上传目录
└── results/                  # 结果存储目录
```

## 环境变量

可以通过环境变量配置以下参数：

```bash
# Dify API配置
DIFY_API_URL=http://114.215.204.62/v1/workflows/run
DIFY_FILE_URL=http://114.215.204.62/v1/files/upload
DIFY_API_TOKEN=your-dify-token

# 应用配置
NODE_ENV=production
PYTHONPATH=/app
```

## 健康检查

系统提供多层健康检查：

1. **Docker健康检查**: 自动检查前端和后端服务
2. **Nginx健康检查**: `/health` 端点
3. **FastAPI健康检查**: `/health` 端点

## 日志管理

日志文件位置：
- **Supervisor**: `/var/log/supervisor/supervisord.log`
- **Nginx**: `/var/log/supervisor/nginx.log`
- **Backend**: `/var/log/supervisor/backend.log`
- **Nginx访问日志**: `/var/log/nginx/access.log`
- **Nginx错误日志**: `/var/log/nginx/error.log`

查看日志：
```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker exec -it food-label-inspection tail -f /var/log/supervisor/backend.log
docker exec -it food-label-inspection tail -f /var/log/supervisor/nginx.log
```

## 故障排除

### 1. 容器无法启动

```bash
# 检查构建过程
docker-compose build --no-cache

# 检查容器状态
docker-compose ps

# 查看详细日志
docker-compose logs
```

### 2. 前端无法访问

- 检查端口 8011 是否被占用
- 确认 Nginx 配置正确
- 查看 Nginx 日志

### 3. 后端API错误

- 检查端口 8000 是否被占用
- 确认 Python 依赖安装正确
- 查看后端日志
- 检查 Dify API 连接

### 4. 文件上传失败

- 检查 uploads 目录权限
- 确认文件大小限制 (50MB)
- 查看后端日志

## 性能优化

### 1. 生产环境配置

- 启用 Nginx gzip 压缩
- 配置静态文件缓存
- 调整 worker 进程数量

### 2. 资源限制

```yaml
# docker-compose.yml 中添加资源限制
services:
  food-label-app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 安全配置

### 1. 网络安全

- 使用 HTTPS (生产环境)
- 配置防火墙规则
- 限制API访问频率

### 2. 文件安全

- 限制上传文件类型
- 扫描上传文件
- 定期清理临时文件

## 备份和恢复

### 1. 数据备份

```bash
# 备份上传文件
docker cp food-label-inspection:/app/uploads ./backup/uploads

# 备份结果文件
docker cp food-label-inspection:/app/results ./backup/results
```

### 2. 配置备份

```bash
# 备份配置文件
cp docker-compose.yml ./backup/
cp -r docker/ ./backup/
```

## 监控和维护

### 1. 系统监控

- 监控容器资源使用情况
- 监控API响应时间
- 监控错误日志

### 2. 定期维护

- 清理旧的上传文件
- 更新依赖包
- 检查安全漏洞

## 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose up -d --build

# 验证部署
curl http://localhost:8011/health
curl http://localhost:8000/health
```

## 技术支持

如遇到问题，请检查：

1. Docker 和 Docker Compose 版本
2. 系统资源使用情况
3. 网络连接状态
4. 日志文件内容

联系方式：请提交 GitHub Issue 或查看项目文档。
