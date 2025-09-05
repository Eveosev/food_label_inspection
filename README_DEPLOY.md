# 食品标签检测系统 - 部署指南

## 概述

本文档详细说明如何将食品标签检测系统部署到阿里云CentOS服务器。部署方案采用Docker容器化技术，支持本地构建镜像后上传到服务器部署，避免在服务器上重新构建。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │  Nginx 反向代理  │    │ 后端 (FastAPI)  │
│   端口: 内部     │◄───│   端口: 8011    │◄───│   端口: 8000    │
│   Vite 构建     │    │   静态文件服务   │    │   Dify API集成  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Docker 容器    │
                    │  Supervisor管理  │
                    └─────────────────┘
```

## 部署流程

### 1. 本地环境准备

#### 1.1 系统要求
- macOS 或 Linux
- Docker Desktop 已安装
- Docker Compose 已安装
- 至少 4GB 可用磁盘空间

#### 1.2 检查环境
```bash
# 检查Docker版本
docker --version
docker-compose --version

# 检查磁盘空间
df -h
```

### 2. 本地构建部署包

#### 2.1 执行构建脚本
```bash
# 给脚本执行权限（如果还没有）
chmod +x build_for_deploy.sh

# 执行构建
./build_for_deploy.sh
```

#### 2.2 构建过程说明
构建脚本会执行以下步骤：
1. 清理旧的Docker镜像和容器
2. 构建新的Docker镜像（**明确指定linux/amd64平台，确保跨平台兼容性**）
3. 导出Docker镜像为tar文件
4. 打包所有部署文件到压缩包

**🔧 跨平台兼容性保证：**
- Dockerfile中使用 `--platform=linux/amd64` 确保构建Linux兼容镜像
- 构建脚本使用 `docker build --platform linux/amd64` 强制Linux平台构建
- 即使在Mac（ARM64）上构建，生成的镜像也能在Linux x86_64服务器上运行

#### 2.3 构建输出
构建完成后会生成：
- `food-label-inspection-deploy-YYYYMMDD-HHMMSS.tar.gz` - 部署压缩包
- 包含以下文件：
  ```
  food-label-inspection.tar          # Docker镜像文件
  docker-compose.prod.yml            # 生产环境compose配置
  deploy_on_server.sh               # 服务器部署脚本
  docker/nginx.conf                 # Nginx配置
  docker/supervisord.conf           # Supervisor配置
  README_DEPLOY.md                  # 部署文档
  ```

### 3. 服务器环境准备

#### 3.1 服务器要求
- CentOS 7/8 或 RHEL 7/8
- 至少 2GB RAM
- 至少 10GB 可用磁盘空间
- root权限或sudo权限

#### 3.2 安装Docker（如果未安装）
```bash
# CentOS 7/8
sudo yum update -y
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
sudo docker --version
```

#### 3.3 安装Docker Compose
```bash
# 下载Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 设置执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 3.4 配置防火墙
```bash
# 开放8011端口
sudo firewall-cmd --permanent --add-port=8011/tcp
sudo firewall-cmd --reload

# 或者关闭防火墙（不推荐生产环境）
sudo systemctl stop firewalld
sudo systemctl disable firewalld
```

### 4. 上传和部署

#### 4.1 上传部署包
```bash
# 使用scp上传（替换为实际的服务器IP和用户）
scp food-label-inspection-deploy-*.tar.gz root@YOUR_SERVER_IP:/root/

# 或使用rsync
rsync -avz food-label-inspection-deploy-*.tar.gz root@YOUR_SERVER_IP:/root/
```

#### 4.2 服务器端部署
```bash
# 登录服务器
ssh root@YOUR_SERVER_IP

# 解压部署包
cd /root
tar -xzf food-label-inspection-deploy-*.tar.gz
cd food-label-inspection-deploy-*/

# 执行部署脚本
chmod +x deploy_on_server.sh
sudo ./deploy_on_server.sh
```

#### 4.3 部署脚本功能
部署脚本会自动执行：
1. 检查Docker和Docker Compose安装
2. 停止现有容器
3. 清理旧镜像
4. 加载新的Docker镜像
5. 检查配置文件
6. 创建必要目录
7. 启动服务
8. 执行健康检查
9. 显示部署信息

### 5. 验证部署

#### 5.1 检查服务状态
```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 检查端口监听
netstat -tlnp | grep 8011
```

#### 5.2 访问应用
- 浏览器访问：`http://YOUR_SERVER_IP:8011`
- 健康检查：`http://YOUR_SERVER_IP:8011/health`
- API文档：`http://YOUR_SERVER_IP:8011/docs`

#### 5.3 功能测试
1. 打开应用首页
2. 上传测试图片
3. 填写检测参数
4. 提交检测请求
5. 查看检测结果

## 管理和维护

### 6.1 常用管理命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看实时日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看资源使用
docker stats

# 清理未使用的镜像
docker image prune -f
```

### 6.2 日志管理

```bash
# 查看应用日志
docker-compose -f docker-compose.prod.yml logs app

# 查看Nginx日志
docker exec -it food-label-app tail -f /var/log/nginx/access.log
docker exec -it food-label-app tail -f /var/log/nginx/error.log

# 查看后端日志
docker exec -it food-label-app tail -f /var/log/supervisor/backend.log
```

### 6.3 备份和恢复

```bash
# 备份数据（如果有持久化数据）
docker-compose -f docker-compose.prod.yml exec app tar -czf /tmp/backup.tar.gz /app/uploads

# 导出备份
docker cp food-label-app:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz

# 恢复数据
docker cp backup-20231201.tar.gz food-label-app:/tmp/
docker-compose -f docker-compose.prod.yml exec app tar -xzf /tmp/backup-20231201.tar.gz -C /
```

### 6.4 更新部署

当需要更新应用时：
1. 在本地重新执行 `build_for_deploy.sh`
2. 上传新的部署包到服务器
3. 重新执行 `deploy_on_server.sh`

## 故障排除

### 7.1 常见问题

#### 问题1：容器启动失败
```bash
# 查看详细错误信息
docker-compose -f docker-compose.prod.yml logs

# 检查镜像是否正确加载
docker images | grep food-label-inspection

# 检查端口是否被占用
netstat -tlnp | grep 8011
```

#### 问题2：无法访问应用
```bash
# 检查防火墙设置
sudo firewall-cmd --list-ports

# 检查Nginx配置
docker exec -it food-label-app nginx -t

# 检查服务监听状态
docker exec -it food-label-app netstat -tlnp
```

#### 问题3：后端API错误
```bash
# 查看后端日志
docker-compose -f docker-compose.prod.yml logs app | grep backend

# 检查Dify API连接
curl -X GET http://localhost:8011/api/test-dify

# 进入容器调试
docker exec -it food-label-app bash
```

### 7.2 性能优化

#### 7.2.1 系统资源监控
```bash
# 监控CPU和内存使用
top
htop

# 监控磁盘使用
df -h
du -sh /var/lib/docker

# 监控网络连接
ss -tuln
```

#### 7.2.2 Docker优化
```bash
# 清理未使用的资源
docker system prune -f

# 限制容器资源使用（在docker-compose.prod.yml中配置）
# 已配置内存限制和CPU限制
```

### 7.3 安全建议

1. **网络安全**
   - 使用防火墙限制访问端口
   - 配置SSL/TLS证书（推荐使用Nginx反向代理）
   - 定期更新系统和Docker

2. **应用安全**
   - 定期更新应用镜像
   - 监控应用日志异常
   - 备份重要数据

3. **访问控制**
   - 限制SSH访问
   - 使用非root用户运行应用（已在Docker中配置）
   - 定期轮换API密钥

## 技术支持

### 8.1 联系信息
- 项目仓库：[项目Git地址]
- 技术文档：本README文件
- 问题反馈：通过Git Issues提交

### 8.2 版本信息
- 应用版本：1.0.0-mvp
- Docker版本要求：>= 20.10
- Docker Compose版本要求：>= 1.29
- 系统要求：CentOS 7/8, RHEL 7/8

### 8.3 更新日志
- 2024-01-01：初始版本发布
- 支持Docker容器化部署
- 支持本地构建远程部署
- 集成Nginx反向代理
- 添加健康检查和监控

---

**注意**：本部署方案适用于生产环境，如需开发环境部署，请参考 `README_DOCKER.md` 文件。
