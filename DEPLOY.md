# 部署指南

本文档提供了项目的部署说明。

## 前置要求

- Docker 和 Docker Compose
- Node.js 18+ (用于本地开发)
- Python 3.10+ (用于本地开发)

## 部署步骤

### 1. 克隆代码

```bash
git clone <repository_url>
cd <project_directory>
```

### 2. 使用 Docker 部署

1. 构建并启动服务：
```bash
docker-compose up -d
```

2. 查看服务状态：
```bash
docker-compose ps
```

3. 查看服务日志：
```bash
docker-compose logs -f
```

### 3. 配置模型

系统提供了两种配置模型的方式：

#### 方式一：通过界面配置（推荐）

1. 访问模型设置页面：
   - 打开浏览器访问 http://localhost:3000
   - 点击导航栏中的"模型设置"

2. 在设置界面中配置：
   - API 密钥：填入各模型提供商的 API 密钥
   - 默认模型：选择要使用的模型
   - 模型参数：调整 temperature、max_tokens 等参数

3. 点击"保存设置"按钮保存配置

#### 方式二：通过环境变量配置

1. 复制环境变量模板文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入必要的配置：
- OPENAI_API_KEY: OpenAI API 密钥
- ANTHROPIC_API_KEY: Anthropic API 密钥
- GOOGLE_API_KEY: Google API 密钥

## 本地开发部署

### 后端

1. 创建并激活虚拟环境：
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate  # Windows
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 启动后端服务：
```bash
uvicorn backend.app.main:app --reload
```

### 前端

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

## 访问服务

- 前端界面: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 模型设置: http://localhost:3000/settings/models

## 目录结构

```
.
├── backend/           # 后端代码
├── frontend/         # 前端代码
├── config/           # 配置文件目录
│   ├── providers.json # 模型提供商配置
│   └── settings.json # 全局模型设置
├── uploads/          # 上传文件目录
├── Dockerfile        # 后端 Dockerfile
├── docker-compose.yml # Docker Compose 配置
└── requirements.txt  # Python 依赖
```

## 模型配置说明

### 支持的模型提供商

1. OpenAI
   - 支持模型：GPT-3.5、GPT-4、GPT-4 Vision
   - 功能：文本生成、图像分析、语音转写

2. Anthropic
   - 支持模型：Claude 3 Opus、Sonnet、Haiku、Vision
   - 功能：文本生成、图像分析

3. Google
   - 支持模型：Gemini Pro、Gemini Pro Vision
   - 功能：文本生成、图像分析

### 配置参数说明

1. 全局设置
   - Temperature: 控制输出的随机性 (0-2)
   - Max Tokens: 最大输出长度
   - Top P: 控制输出的多样性 (0-1)
   - Frequency Penalty: 频率惩罚 (-2 到 2)
   - Presence Penalty: 存在惩罚 (-2 到 2)

2. 提供商设置
   - API Key: 访问 API 的密钥
   - API Base URL: 自定义 API 端点（可选）
   - Default Model: 默认使用的模型

## 常见问题

1. 端口冲突
如果遇到端口冲突，可以在 `docker-compose.yml` 中修改端口映射。

2. 权限问题
确保 `config` 和 `uploads` 目录具有正确的读写权限。

3. API 密钥配置
- 推荐使用界面配置方式，更安全且方便管理
- 如果使用环境变量，确保密钥安全存储

4. 配置不生效
- 检查配置文件是否正确保存
- 重启服务以应用新配置

## 更新部署

1. 拉取最新代码：
```bash
git pull
```

2. 重新构建并启动服务：
```bash
docker-compose up -d --build
```

## 备份

定期备份以下目录：
- `config/`: 包含模型配置
  - `providers.json`: 模型提供商配置
  - `settings.json`: 全局模型设置
- `uploads/`: 包含上传的文件

## 监控

可以通过以下命令监控服务状态：
```bash
docker-compose ps
docker-compose logs -f
```

## 安全建议

1. API 密钥管理
   - 使用界面配置时，密钥会加密存储在配置文件中
   - 定期轮换 API 密钥
   - 限制 API 密钥的权限范围

2. 访问控制
   - 在生产环境中配置适当的 CORS 策略
   - 考虑添加身份验证机制
   - 限制上传文件的大小和类型

3. 数据安全
   - 定期备份配置文件
   - 加密敏感数据
   - 监控异常访问 