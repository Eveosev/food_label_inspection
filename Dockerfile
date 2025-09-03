# 使用Python 3.11作为基础镜像
FROM ubuntu:20.04

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y python3 python3-pip python-is-python3

# 安装Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# 复制requirements.txt并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装Node.js依赖
RUN npm install

# 复制项目文件
COPY . .

# 创建必要的目录
RUN mkdir -p uploads results

# 设置脚本执行权限
RUN chmod +x start_simple.sh start_simple_docker.sh run_backend_simple.py

# 暴露端口
EXPOSE 8017

# 设置环境变量
ENV PYTHONPATH=/app
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8017/docs || exit 1

# 启动脚本
CMD ["./start_simple_docker.sh"]
