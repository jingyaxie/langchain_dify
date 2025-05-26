#!/bin/bash

# 确保脚本在错误时退出
set -e

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# 检查网络连接
echo "检查网络连接..."
if ! ping -c 1 registry.cn-hangzhou.aliyuncs.com > /dev/null 2>&1; then
    echo "警告: 无法连接到镜像源，请检查网络连接"
    echo "尝试使用本地构建..."
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

# 清理 Docker 缓存
echo "清理 Docker 缓存..."
docker system prune -f

# 构建并启动服务
echo "Building and starting services..."
max_retries=3
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if docker-compose -f docker-compose.prod.yml up --build -d; then
        break
    else
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo "构建失败，正在重试 ($retry_count/$max_retries)..."
            sleep 5
        else
            echo "构建失败，已达到最大重试次数"
            exit 1
        fi
    fi
done

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