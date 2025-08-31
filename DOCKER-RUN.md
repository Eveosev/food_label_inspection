# Docker 后台运行命令指南

## 🚀 快速启动

### 1. 一键部署（推荐）
```bash
./deploy-prod.sh
```

### 2. 手动部署步骤

#### 步骤1: 构建镜像
```bash
# 构建前端镜像
docker build -f docker/frontend.Dockerfile -t food-safety-frontend:latest .

# 构建后端镜像
docker build -f docker/backend.Dockerfile -t food-safety-backend:latest .
```

#### 步骤2: 启动服务
```bash
# 后台启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 常用管理命令

### 查看服务状态
```bash
# 查看所有容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看容器详细信息
docker ps -a
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f redis

# 查看最近100行日志
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

### 停止服务
```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 停止并删除数据卷
docker-compose -f docker-compose.prod.yml down -v
```

### 更新服务
```bash
# 拉取最新代码后重新部署
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔧 容器管理

### 进入容器
```bash
# 进入后端容器
docker exec -it food-safety-backend-prod bash

# 进入前端容器
docker exec -it food-safety-frontend-prod sh

# 进入Redis容器
docker exec -it food-safety-redis-prod redis-cli
```

### 容器监控
```bash
# 查看容器资源使用情况
docker stats

# 查看特定容器资源使用
docker stats food-safety-backend-prod food-safety-frontend-prod
```

### 备份和恢复
```bash
# 备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ results/ logs/

# 恢复数据
tar -xzf backup-20241228.tar.gz
```

## 🏥 健康检查

### 检查服务健康状态
```bash
# 检查后端健康状态
curl -f http://localhost:8000/health

# 检查前端健康状态
curl -f http://localhost/

# 检查Redis健康状态
docker exec food-safety-redis-prod redis-cli ping
```

### 自动健康检查
Docker Compose配置中已包含健康检查：
- 后端: 每30秒检查一次 `/health` 接口
- 前端: 每30秒检查一次根路径
- Redis: 每30秒执行 `ping` 命令

## 📊 监控和日志

### 日志管理
```bash
# 查看日志文件大小
du -sh logs/

# 清理旧日志
find logs/ -name "*.log" -mtime +7 -delete

# 查看错误日志
docker-compose -f docker-compose.prod.yml logs | grep ERROR
```

### 性能监控
```bash
# 查看系统资源使用
htop
free -h
df -h

# 查看网络连接
netstat -tulpn | grep :80
netstat -tulpn | grep :8000
```

## 🔒 安全配置

### 防火墙设置
```bash
# 只开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### SSL配置（可选）
```bash
# 使用Nginx反向代理配置SSL
# 创建SSL证书
sudo certbot certonly --standalone -d yourdomain.com

# 配置Nginx
sudo nano /etc/nginx/sites-available/food-safety
```

## 🚨 故障排除

### 常见问题

1. **端口冲突**
```bash
# 检查端口占用
lsof -i :80
lsof -i :8000

# 修改端口映射
# 编辑 docker-compose.prod.yml
```

2. **容器启动失败**
```bash
# 查看详细错误信息
docker-compose -f docker-compose.prod.yml logs

# 检查镜像是否存在
docker images | grep food-safety
```

3. **数据库连接失败**
```bash
# 测试MongoDB连接
python3 test_mongodb.py

# 检查网络连接
ping 114.215.204.62
telnet 114.215.204.62 27017
```

4. **内存不足**
```bash
# 查看内存使用
free -h

# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 重启策略
- `restart: unless-stopped`: 容器异常退出时自动重启
- 健康检查失败3次后容器会被标记为不健康
- 系统重启后容器会自动启动

## 📈 性能优化

### 资源限制
```yaml
# 在 docker-compose.prod.yml 中添加
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 缓存优化
```bash
# Redis缓存配置
# 编辑 redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## 🔄 自动化部署

### 使用systemd服务
```bash
# 复制服务文件
sudo cp food-safety.service /etc/systemd/system/

# 启用服务
sudo systemctl enable food-safety.service

# 启动服务
sudo systemctl start food-safety.service

# 查看服务状态
sudo systemctl status food-safety.service
```

### 定时备份
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz uploads/ results/ logs/
find . -name "backup_*.tar.gz" -mtime +7 -delete
