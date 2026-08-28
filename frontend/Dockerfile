# 前端 Dockerfile
# 第一阶段：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 设置生产环境 API 地址（Nginx 会代理 /api/ 到后端）
ENV VITE_API_URL=/api/v1

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建
RUN npm run build

# 第二阶段：用 nginx 提供静态文件
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
