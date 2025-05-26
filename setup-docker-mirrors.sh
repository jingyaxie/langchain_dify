#!/bin/bash

# 确保脚本在错误时退出
set -e

echo "开始配置 Docker 国内镜像源..."

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 创建 Docker 配置目录
mkdir -p /etc/docker

# 备份现有的 daemon.json（如果存在）
if [ -f /etc/docker/daemon.json ]; then
    echo "备份现有的 daemon.json..."
    cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
fi

# 创建新的 daemon.json 配置文件
echo "配置 Docker 镜像源..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://dockerhub.azk8s.cn",
    "https://reg-mirror.qiniu.com",
    "https://hub-mirror.c.163.com"
  ],
  "dns": ["8.8.8.8", "114.114.114.114"]
}
EOF

# 重启 Docker 服务
echo "重启 Docker 服务..."
systemctl daemon-reload
systemctl restart docker

# 验证配置
echo "验证 Docker 配置..."
docker info | grep "Registry Mirrors" -A 5

echo "Docker 国内镜像源配置完成！"
echo "现在可以重新运行 ./deploy.sh 了" 