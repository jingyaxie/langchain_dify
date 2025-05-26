#!/bin/bash

# 确保脚本在错误时退出
set -e

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# 创建必要的目录
mkdir -p nginx/ssl nginx/logs

# 检查 SSL 证书
if [ ! -f nginx/ssl/server.crt ] || [ ! -f nginx/ssl/server.key ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/server.key \
        -out nginx/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# 拉取最新代码
echo "Pulling latest code..."
git pull

# 构建并启动服务
echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# 等待服务启动
echo "Waiting for services to start..."
sleep 10

# 检查服务健康状态
echo "Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Services are healthy!"
else
    echo "Warning: Health check failed"
fi

# 显示日志
echo "Showing logs (press Ctrl+C to exit)..."
docker-compose -f docker-compose.prod.yml logs -f 