#!/bin/bash

# Docker容器启动脚本
echo "Starting Food Label Inspection Application in Docker..."

# 创建必要的目录
mkdir -p /app/uploads /app/results /var/log/nginx /var/log/supervisor

# 设置权限
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 启动supervisor管理的服务
echo "Starting services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
