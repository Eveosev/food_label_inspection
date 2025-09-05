# 多阶段构建 - 前端构建阶段
# 明确指定Linux平台，确保跨平台兼容性
FROM --platform=linux/amd64 node:18-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
COPY vite.config.js ./

# 设置npm中国源并安装前端依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci

# 复制前端源码
COPY src/ ./src/
COPY index.html ./

# 构建前端
RUN npm run build

# 生产环境镜像
# 明确指定Linux平台，确保跨平台兼容性
FROM --platform=linux/amd64 python:3.11-slim

# 设置工作目录
WORKDIR /app

# 更换为中国源加速下载
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements.txt并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 复制后端代码
COPY backend/ ./backend/
COPY run_backend_simple.py ./
COPY start_simple_docker.sh ./

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/dist /var/www/html

# 创建必要的目录
RUN mkdir -p uploads results /var/log/supervisor

# 复制配置文件
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 设置脚本执行权限
RUN chmod +x start_simple_docker.sh run_backend_simple.py

# 暴露端口 (前端8011, 后端8000)
EXPOSE 8011 8000

# 设置环境变量
ENV PYTHONPATH=/app
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8011/ && curl -f http://localhost:8000/health || exit 1

# 启动脚本
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
