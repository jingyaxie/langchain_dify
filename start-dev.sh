#!/bin/bash

# 确保脚本在错误时退出
set -e

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# 构建并启动服务
echo "Starting development environment..."
docker-compose -f docker-compose.dev.yml up --build -d

# 显示日志
echo "Showing logs (press Ctrl+C to exit)..."
docker-compose -f docker-compose.dev.yml logs -f 