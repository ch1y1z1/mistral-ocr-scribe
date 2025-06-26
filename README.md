# Mistral OCR 文字识别

一个基于 Mistral AI OCR API 的现代化文字识别应用，支持图片和 PDF 文档的智能文字提取。

## 🌟 在线体验

**立即访问**: [https://mistral-ocr-scribe.lovable.app/](https://mistral-ocr-scribe.lovable.app/)

## ✨ 主要功能

### 📄 多格式支持

- **图片识别**: JPG, PNG, GIF, BMP, WebP
- **文档识别**: PDF 文档
- **URL输入**: 支持在线图片和文档链接

### 🎯 智能提取

- **文字识别**: 高精度的 OCR 文字识别
- **图片提取**: 自动提取文档中的图片内容
- **Markdown 输出**: 识别结果自动格式化为 Markdown

### 💾 多种下载方式

- **复制文字**: 一键复制识别结果
- **下载 Markdown**: 保存为 .md 格式文件
- **完整压缩包**: 包含文字和图片的完整压缩包
  - `ocr-result.md` - Markdown 格式的识别结果
  - `images/` 文件夹 - 提取的所有图片

### 🎨 现代化界面

- **玻璃态设计**: 现代美观的毛玻璃效果
- **响应式布局**: 完美适配桌面端和移动端
- **智能折叠**: API 配置卡片可折叠节省空间
- **实时反馈**: 详细的处理进度和状态提示

## 🚀 快速开始

### 1. 配置 API 密钥

- 获取 [Mistral AI API 密钥](https://console.mistral.ai/)
- 在应用中输入你的 API 密钥（安全存储在本地）

### 2. 上传文件或输入 URL

- **文件上传**: 拖拽或点击上传图片/PDF
- **URL 输入**: 粘贴在线文件链接

### 3. 开始识别

- 点击"开始识别文字"按钮
- 等待 AI 处理完成
- 查看和下载识别结果

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite + Bun
- **样式方案**: Tailwind CSS + shadcn/ui
- **图标库**: Lucide React
- **AI服务**: Mistral AI OCR API
- **文件处理**: JSZip (压缩包生成)
- **容器化**: Docker + Caddy Web Server

## 📦 本地开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

```bash
# 克隆项目
git clone <YOUR_GIT_URL>
cd mistral-ocr-scribe

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🐳 Docker 部署

本项目支持 Docker 容器化部署，使用多阶段构建优化镜像大小。

### 快速部署

```bash
# 构建镜像
docker build -t mistral-ocr .

# 运行容器
docker run -d -p 8080:80 --name mistral-ocr-app mistral-ocr
```

### 使用 Docker Compose

```bash
# 启动生产环境
docker-compose up -d

# 启动开发环境（包含热重载）
docker-compose --profile dev up -d

# 停止服务
docker-compose down
```

### Docker 特性

- **🏗️ 多阶段构建**: 使用 Bun 构建 + Caddy 服务，镜像大小约 15-20MB
- **⚡ 高性能**: Caddy Web 服务器提供静态文件服务
- **🔒 安全配置**: 内置安全头部和 CSP 策略
- **📱 SPA 支持**: 完美支持 React Router 前端路由
- **💾 缓存优化**: 静态资源缓存 1 年，HTML 缓存 1 小时
- **🗜️ Gzip 压缩**: 自动压缩传输内容
- **🏥 健康检查**: 内置 `/health` 端点用于监控

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+

### 生产部署建议

- 使用反向代理（Nginx/Traefik）配置 HTTPS 和域名绑定
- 支持水平扩展和负载均衡
- 建议配置持久化日志和监控

## 📁 项目结构

```text
src/
├── components/           # React 组件
│   ├── ui/              # shadcn/ui 基础组件
│   ├── ApiKeyManager.tsx # API 密钥管理
│   ├── FileUpload.tsx   # 文件上传组件
│   ├── UrlInput.tsx     # URL 输入组件
│   └── OcrResults.tsx   # 结果展示组件
├── pages/
│   └── Index.tsx        # 主页面
├── hooks/               # React Hooks
└── lib/                 # 工具函数
```

## 🔧 核心特性

### API 密钥管理

- 本地安全存储
- 可折叠界面节省空间
- 实时配置状态显示

### 文件处理

- 支持拖拽上传
- 文件类型验证
- 大小限制检查（20MB）
- 自动 Base64 转换

### 智能识别

- Mistral OCR 最新模型
- 图片和文档同时支持
- 自动图片提取和命名
- Markdown 路径自动修正

### 下载功能

- 单独文字下载（.md）
- 完整压缩包下载（.zip）
- 图片路径自动匹配
- 文件名智能生成

## 🎨 设计特色

- **玻璃态效果**: 毛玻璃背景增强视觉层次
- **渐变配色**: 蓝紫粉三色渐变主题
- **图标容器**: 每个功能都有专属渐变图标
- **悬停动画**: 丰富的交互反馈效果
- **响应式设计**: 移动端优化显示

## 📞 支持与反馈

如果你遇到问题或有改进建议，欢迎：

- 提交 GitHub Issues

---

**在线体验**: [https://mistral-ocr-scribe.lovable.app/](https://mistral-ocr-scribe.lovable.app/)

Made with ❤️ using Mistral AI & Lovable & Claude Code
