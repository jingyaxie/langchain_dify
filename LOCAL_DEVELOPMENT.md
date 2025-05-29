# 本地开发指南 - LangChain Dify Clone

## 🎯 项目概述

这是一个基于 LangChain 的 Dify 替代系统，支持智能体配置、知识库管理和对话功能。项目采用独立环境设计，避免污染系统环境。

## 📋 环境要求

### 系统要求
- **操作系统**: macOS, Linux, Windows (WSL)
- **Python**: 3.9+ (推荐 3.11)
- **Node.js**: 16+ (推荐 18+)
- **内存**: 4GB+ (推荐 8GB+)

### 推荐开发工具
- VS Code + Python + TypeScript 插件
- Git
- Postman (API测试)

## 🚀 快速开始

### 1. 一键启动 (推荐)

```bash
# 克隆项目
git clone <repository>
cd langchain_dify

# 一键启动 (自动处理所有环境设置)
./start-local-dev.sh
```

### 2. 手动设置

#### 步骤 1: 环境配置
```bash
# 复制环境配置
cp env.example .env

# 编辑配置文件，填入API密钥
vim .env  # 或使用其他编辑器
```

#### 步骤 2: 后端设置
```bash
# 创建Python虚拟环境
python3.11 -m venv backend/venv

# 激活虚拟环境
cd backend
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 步骤 3: 前端设置
```bash
# 新建终端窗口
cd frontend

# 安装依赖
npm install

# 启动前端服务
npm run dev
```

## 🔧 项目结构

```
langchain_dify/
├── backend/                    # 后端 (FastAPI + LangChain)
│   ├── venv/                  # Python虚拟环境 (本地)
│   ├── app/                   # 应用代码
│   │   ├── core/             # 核心配置和工具
│   │   ├── api/              # API路由
│   │   ├── services/         # 业务逻辑
│   │   └── models/           # 数据模型
│   └── requirements.txt       # Python依赖
├── frontend/                   # 前端 (React + Next.js)
│   ├── node_modules/         # Node.js模块 (本地)
│   ├── pages/                # 页面组件
│   ├── components/           # UI组件
│   └── package.json          # Node.js依赖
├── uploads/                    # 文件上传目录 (本地)
├── chroma_data/               # 向量数据库 (本地)
├── logs/                      # 日志目录 (本地)
├── .env                       # 环境变量 (本地)
└── start-local-dev.sh         # 本地开发启动脚本
```

## 🔑 环境变量配置

编辑 `.env` 文件：

```bash
# AI API 配置 (至少配置一个)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here  
GOOGLE_API_KEY=your-google-key-here

# 应用配置
DEBUG=true
API_HOST=127.0.0.1
API_PORT=8000

# 数据库配置 (默认本地)
DATABASE_URL=sqlite:///./langchain_dify.db
CHROMA_PERSIST_DIRECTORY=./chroma_data

# 安全配置
SECRET_KEY=your-secret-key-for-development
```

## 🌐 服务访问

启动成功后，可以访问：

- **前端界面**: http://localhost:3000
- **后端API**: http://127.0.0.1:8000
- **API文档**: http://127.0.0.1:8000/docs
- **交互式API**: http://127.0.0.1:8000/redoc

## 📦 依赖管理

### Python依赖 (后端)
```bash
# 激活虚拟环境
cd backend && source venv/bin/activate

# 查看已安装包
pip list

# 安装新包
pip install <package>

# 更新requirements.txt
pip freeze > requirements.txt
```

### Node.js依赖 (前端)
```bash
cd frontend

# 查看已安装包
npm list

# 安装新包
npm install <package>

# 更新包
npm update
```

## 🔍 开发工具

### 1. 依赖检查
```bash
# 运行依赖检查
python check_dependencies.py

# 或通过启动脚本
./start-local-dev.sh  # 选择选项4
```

### 2. 代码格式化
```bash
# Python代码格式化
cd backend && source venv/bin/activate
black .
isort .
ruff check .

# 前端代码格式化
cd frontend
npm run lint
```

### 3. 测试
```bash
# 后端测试
cd backend && source venv/bin/activate
pytest

# 前端测试 (如果配置了)
cd frontend
npm test
```

## 🐛 常见问题

### 1. Python版本问题
```bash
# 如果Python 3.11不可用，尝试其他版本
python3.10 -m venv backend/venv
# 或
python3.9 -m venv backend/venv
```

### 2. 依赖安装失败
```bash
# 清理缓存重新安装
cd backend
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 端口冲突
```bash
# 更改端口
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# 或修改.env文件
API_PORT=8001
```

### 4. 前端安全漏洞
```bash
cd frontend
npm audit fix
# 如果需要强制修复
npm audit fix --force
```

## 📊 性能监控

### 本地开发监控
- **后端日志**: `logs/app.log`
- **前端控制台**: 浏览器开发者工具
- **API性能**: http://127.0.0.1:8000/docs 中的响应时间

### 资源使用
- **内存**: 后端约500MB，前端约200MB
- **存储**: 依赖包约1GB，数据文件根据使用情况
- **网络**: API调用到外部服务 (OpenAI等)

## 🔒 安全注意事项

### 本地开发安全
1. **API密钥保护**: 不要提交 `.env` 文件到代码库
2. **本地访问**: 默认只监听本地地址 (127.0.0.1)
3. **数据隔离**: 所有数据存储在项目目录内
4. **虚拟环境**: 依赖隔离，不影响系统环境

### 网络安全
```bash
# 检查监听端口
lsof -i :8000
lsof -i :3000

# 确保只监听本地
netstat -an | grep LISTEN
```

## 🚢 部署准备

当本地开发完成后，可以切换到Docker部署：

```bash
# 停止本地开发服务
# Ctrl+C 停止 start-local-dev.sh

# 使用Docker部署
docker-compose up -d
```

## 📞 技术支持

- **文档**: 查看 `RULES.md` 和 `DEPENDENCY_REPORT.md`
- **问题排查**: 运行 `python check_dependencies.py`
- **日志分析**: 查看 `logs/` 目录下的日志文件

---

**开发愉快！** 🎉 