# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

### 开发环境
```bash
npm run dev        # 启动开发服务器 (localhost:8080)
npm run build      # 构建生产版本
npm run build:dev  # 构建开发版本
npm run preview    # 预览构建结果
npm run lint       # 运行 ESLint 检查
```

### Docker 环境
```bash
# 构建 Docker 镜像
docker build -t mistral-ocr .

# 运行生产环境容器
docker run -d -p 8080:80 --name mistral-ocr-app mistral-ocr

# 或使用 docker-compose
docker-compose up -d                    # 启动生产环境
docker-compose --profile dev up -d      # 启动开发环境

# 停止和清理
docker-compose down                     # 停止容器
docker-compose down -v                  # 停止容器并删除卷
```

## 项目架构

### 技术栈
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui 组件库
- React Query 用于状态管理
- React Router 用于路由
- JSZip 用于压缩包生成

### 核心业务流程
1. **API 密钥管理**: 用户输入 Mistral API 密钥，存储在 localStorage
2. **文件输入处理**: 支持文件上传和 URL 输入两种方式
3. **OCR 识别**: 调用 Mistral OCR API (`https://api.mistral.ai/v1/ocr`)
4. **结果处理**: 提取文字和图片，支持多种下载格式

### 文件结构
```
src/
├── components/
│   ├── ui/              # shadcn/ui 基础组件
│   ├── ApiKeyManager.tsx # API 密钥管理组件
│   ├── FileUpload.tsx   # 文件上传组件  
│   ├── UrlInput.tsx     # URL 输入组件
│   └── OcrResults.tsx   # 结果展示组件
├── pages/
│   └── Index.tsx        # 主页面
├── hooks/               # React Hooks
└── lib/
    └── utils.ts         # 工具函数
```

### OCR API 集成
- **模型**: 使用 `mistral-ocr-latest`
- **输入格式**: 支持 base64 编码的图片和 PDF
- **响应结构**: `data.pages[]` 包含 `markdown` 和 `images` 字段
- **图片提取**: 自动提取文档中的图片并生成下载链接

### 状态管理
- API 密钥存储在 localStorage
- 文件状态和 OCR 结果通过 React state 管理
- 使用 React Query 处理异步操作

### UI 设计特色
- 玻璃态毛玻璃效果背景
- 蓝紫粉渐变主题配色
- 响应式设计，支持移动端
- 可折叠的 API 配置界面

### 文件处理逻辑
- 图片文件: 转换为 base64 后通过 `image_url` 字段发送
- PDF 文件: 转换为 base64 后通过 `document_url` 字段发送
- URL 输入: 根据扩展名判断是图片还是文档
- 大小限制: 20MB

### 下载功能
- **复制文字**: 直接复制识别结果到剪贴板
- **下载 Markdown**: 保存为 .md 文件
- **完整压缩包**: 包含 Markdown 文件和提取的图片文件夹

## Docker 部署

### 架构说明
- **多阶段构建**: 使用 Bun 构建应用，Caddy 提供静态文件服务
- **基础镜像**: `oven/bun:1-alpine` (构建阶段) + `caddy:2-alpine` (运行阶段)
- **镜像优化**: 通过 .dockerignore 和多阶段构建最小化镜像大小

### 配置文件
- **Dockerfile**: 多阶段构建配置
- **Caddyfile**: Caddy Web 服务器配置，包含 SPA 路由和安全头部
- **docker-compose.yml**: 容器编排配置，支持生产和开发环境
- **.dockerignore**: 构建上下文优化

### 部署特性
- **静态文件缓存**: 资源文件缓存 1 年，HTML 缓存 1 小时
- **Gzip 压缩**: 自动压缩传输内容
- **安全头部**: 包含 CSP、XSS 保护等安全配置
- **健康检查**: 内置 /health 端点用于容器健康监控
- **SPA 路由**: 支持 React Router 的前端路由

### 生产部署建议
- 使用 `docker-compose up -d` 启动生产环境
- 镜像大小约 15-20MB (Caddy Alpine + 构建产物)
- 支持水平扩展和负载均衡
- 建议配置反向代理 (Nginx/Traefik) 用于 HTTPS 和域名绑定