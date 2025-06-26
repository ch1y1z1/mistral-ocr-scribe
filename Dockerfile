# 第一阶段：使用 Bun 构建应用
FROM oven/bun:1-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 bun.lockb
COPY package.json bun.lockb* ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN bun run build

# 第二阶段：使用 Caddy 作为 Web 服务器
FROM caddy:2-alpine

# 复制构建产物到 Caddy 的默认目录
COPY --from=builder /app/dist /usr/share/caddy

# 复制 Caddyfile 配置
COPY Caddyfile /etc/caddy/Caddyfile

# 暴露端口
EXPOSE 80

# 使用 Caddy 的默认启动命令