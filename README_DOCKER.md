# 食品标签检测系统 - Docker 部署版本

## 🚀 快速开始

### 一键部署
```bash
# 克隆项目后，直接运行构建和测试脚本
./build_and_test.sh
```

### 手动部署
```bash
# 1. 构建并启动服务
docker-compose up -d --build

# 2. 访问应用
# 前端: http://localhost:8011
# 后端: http://localhost:8000
```

## 📁 项目结构

```
food_label_inspection/
├── 🐳 Docker 配置
│   ├── Dockerfile                 # 多阶段构建配置
│   ├── docker-compose.yml         # 服务编排配置
│   ├── start_simple_docker.sh     # 容器启动脚本
│   └── docker/
│       ├── nginx.conf            # Nginx 反向代理配置
│       └── supervisord.conf      # 进程管理配置
├── 🛠️ 部署工具
│   ├── build_and_test.sh         # 一键构建测试脚本
│   └── DEPLOYMENT.md             # 详细部署指南
├── 🎯 应用代码
│   ├── backend/                  # FastAPI 后端
│   ├── src/                      # React 前端
│   ├── package.json              # 前端依赖
│   ├── requirements.txt          # 后端依赖
│   └── vite.config.js            # 前端构建配置
└── 📂 数据目录
    ├── uploads/                  # 文件上传目录
    └── results/                  # 结果存储目录
```

## 🏗️ 架构设计

### 容器架构
```
┌─────────────────────────────────────┐
│           Docker Container          │
├─────────────────────────────────────┤
│  Nginx (Port 8011)                  │
│  ├── 静态文件服务 (React Build)      │
│  └── API 反向代理 → FastAPI         │
├─────────────────────────────────────┤
│  FastAPI Backend (Port 8000)       │
│  ├── 文件上传处理                   │
│  ├── Dify API 集成                 │
│  └── 健康检查端点                   │
├─────────────────────────────────────┤
│  Supervisor 进程管理                │
│  ├── Nginx 进程监控                 │
│  └── Python 进程监控               │
└─────────────────────────────────────┘
```

### 网络流量
```
用户请求 → Nginx:8011 → 静态文件 (前端)
                    ↓
                API请求 → FastAPI:8000 → Dify API
```

## 🔧 配置说明

### 端口配置
- **8011**: 前端应用端口 (用户访问)
- **8000**: 后端API端口 (内部通信)

### 环境变量
```bash
NODE_ENV=production          # 生产环境模式
PYTHONPATH=/app             # Python 路径
DIFY_API_URL=...            # Dify API 地址
DIFY_API_TOKEN=...          # Dify API 令牌
```

### 数据卷挂载
```yaml
volumes:
  - ./uploads:/app/uploads    # 上传文件持久化
  - ./results:/app/results    # 结果文件持久化
  - app-logs:/var/log        # 日志文件持久化
```

## 🔍 健康检查

系统提供多层健康检查机制：

1. **Docker 健康检查**: 自动检测服务状态
2. **Nginx 健康检查**: `/health` 端点
3. **FastAPI 健康检查**: `/health` 端点

检查命令：
```bash
curl http://localhost:8011/health  # 前端健康检查
curl http://localhost:8000/health  # 后端健康检查
```

## 📊 监控和日志

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f food-label-app

# 进入容器查看详细日志
docker exec -it food-label-inspection bash
tail -f /var/log/supervisor/backend.log
tail -f /var/log/supervisor/nginx.log
```

### 监控指标
- 容器资源使用情况
- API 响应时间
- 错误日志统计
- 文件上传成功率

## 🛡️ 安全特性

### 文件安全
- 限制上传文件类型 (JPEG, PNG, PDF)
- 文件大小限制 (50MB)
- 临时文件自动清理

### 网络安全
- CORS 配置
- 反向代理隐藏后端
- 健康检查端点保护

## 🚀 部署流程

### 1. 多阶段构建
```dockerfile
# 阶段1: 前端构建
FROM node:18-alpine AS frontend-builder
# 构建 React 应用

# 阶段2: 生产环境
FROM python:3.11-slim
# 安装 Python 依赖和系统服务
# 复制前端构建产物
```

### 2. 服务启动
```bash
Supervisor 启动
├── Nginx 服务 (优先级 10)
└── FastAPI 服务 (优先级 20)
```

### 3. 健康检查
```bash
等待 40 秒启动时间
├── 检查前端服务 (8011/health)
└── 检查后端服务 (8000/health)
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   lsof -i :8011
   lsof -i :8000
   ```

2. **容器启动失败**
   ```bash
   # 查看构建日志
   docker-compose build --no-cache
   docker-compose logs
   ```

3. **前端无法访问**
   ```bash
   # 检查 Nginx 配置
   docker exec -it food-label-inspection nginx -t
   ```

4. **后端 API 错误**
   ```bash
   # 查看后端日志
   docker exec -it food-label-inspection tail -f /var/log/supervisor/backend.log
   ```

## 📈 性能优化

### 生产环境建议
- 启用 Nginx gzip 压缩
- 配置静态文件缓存
- 调整 worker 进程数量
- 设置资源限制

### 扩展性
- 支持水平扩展 (多容器)
- 负载均衡配置
- 数据库持久化
- 缓存层添加

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建部署
docker-compose down
docker-compose up -d --build

# 验证部署
./build_and_test.sh
```

## 📞 技术支持

### 获取帮助
1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 详细指南
2. 检查日志文件排查问题
3. 提交 GitHub Issue

### 开发环境
如需本地开发，请使用：
```bash
# 前端开发
npm run dev

# 后端开发  
python run_backend_simple.py
```

---

**🎉 现在您可以使用 `./build_and_test.sh` 一键部署整个系统！**
