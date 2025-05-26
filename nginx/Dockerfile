FROM nginx:alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制配置文件
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# 创建必要的目录
RUN mkdir -p /var/log/nginx

# 设置权限
RUN chown -R nginx:nginx /var/log/nginx

# 使用非 root 用户运行
USER nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"] 