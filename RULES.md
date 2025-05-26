# LangChain Dify 项目规范

## 1. 项目结构

### 1.1 目录结构
```
.
├── backend/                 # 后端服务
│   ├── app/                # 应用代码
│   │   ├── api/           # API 路由
│   │   ├── core/          # 核心功能
│   │   ├── models/        # 数据模型
│   │   └── services/      # 业务服务
│   ├── tests/             # 测试代码
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端应用
│   ├── components/        # React 组件
│   ├── pages/            # 页面组件
│   ├── services/         # API 服务
│   ├── styles/           # 样式文件
│   └── types/            # TypeScript 类型
└── docker/                # Docker 配置
```

### 1.2 文件命名
- 使用 kebab-case 命名文件：`user-profile.tsx`
- 组件文件使用 PascalCase：`UserProfile.tsx`
- 测试文件以 `.test.ts` 或 `.spec.ts` 结尾
- 类型定义文件以 `.d.ts` 结尾

## 2. 代码规范

### 2.1 TypeScript
- 使用 TypeScript 4.x 或更高版本
- 所有组件必须使用 TypeScript
- 定义清晰的接口和类型
- 避免使用 `any` 类型
- 使用类型推断，但保持类型声明清晰

### 2.2 React
- 使用函数组件和 Hooks
- 组件文件结构：
  ```typescript
  import React from 'react';
  import { ComponentProps } from '../types';
  
  export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
    // 组件逻辑
    return (
      // JSX
    );
  };
  ```
- 使用 Chakra UI 组件库
- 遵循 React 最佳实践和性能优化

### 2.3 状态管理
- 使用 React Hooks 管理本地状态
- 使用 Context API 管理全局状态
- 复杂状态考虑使用 Redux 或 Zustand

### 2.4 样式规范
- 使用 Chakra UI 的主题系统
- 遵循响应式设计原则
- 使用 CSS-in-JS 方案
- 保持样式的一致性和可维护性

### 2.5 通用规范
- 使用 TypeScript 进行开发
- 遵循 ESLint 和 Prettier 配置
- 使用 Git Flow 工作流
- 代码提交前进行代码审查

### 2.6 前端规范
- 使用 React 18+ 和 Next.js 13+
- 使用 Chakra UI 组件库
- 使用 React Query 进行数据获取
- 使用 Zustand 进行状态管理
- 组件采用函数式组件和 Hooks
- 使用 CSS-in-JS 进行样式管理

### 2.7 后端规范
- 使用 FastAPI 框架
- 使用 SQLAlchemy 进行数据库操作
- 使用 Pydantic 进行数据验证
- 使用异步编程模式
- 实现完整的错误处理

## 3. API 规范

### 3.1 RESTful API
- 使用标准 HTTP 方法
- 使用 JSON 格式
- 实现版本控制
- 使用 JWT 认证
- 实现速率限制

### 3.2 API 响应格式
```json
{
  "status": 200,
  "data": {},
  "message": "success"
}
```

### 3.3 错误处理
```json
{
  "status": 400,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid input parameters"
  }
}
```

### 3.4 大模型 API 集成

#### 3.4.1 API 配置
- 使用环境变量管理 API 密钥
- 支持多个 API 提供商
- 实现 API 调用重试机制
- 实现 API 调用限流

#### 3.4.2 支持的 API 提供商
- OpenAI API
- Azure OpenAI API
- Anthropic API
- 其他兼容 OpenAI 的 API

#### 3.4.3 API 调用规范
- 使用统一的 API 客户端
- 实现请求超时处理
- 实现错误重试机制
- 支持流式响应

#### 3.4.4 模型配置
- 支持模型参数配置
- 支持模型版本管理
- 支持模型回退机制
- 支持模型性能监控

## 4. 文档处理

### 4.1 文档类型支持
- 文本文件：txt, markdown, html, json, xml
- 图片：jpeg, png, gif, webp
- 文档：pdf, doc, docx, xls, xlsx, ppt, pptx
- 视频：mp4, webm, ogg

### 4.2 文档预览
- 使用浏览器原生功能预览基础文件
- 私有文档通过后端服务转换
- 实现文档预览缓存机制
- 支持文档全屏预览

### 4.3 文档安全
- 实现文档访问权限控制
- 敏感文档加密存储
- 文档操作审计日志
- 防止未授权访问

### 4.4 文档处理流程
1. 文档上传
2. 格式验证
3. 内容提取
4. 文本分块
5. 向量化处理
6. 索引存储

### 4.5 文件大小限制
- 文件大小限制

### 4.6 文件类型验证
- 文件类型验证

### 4.7 内容安全检查
- 内容安全检查

## 5. 测试规范

### 5.1 单元测试
- 使用 Jest 进行前端测试
- 使用 Pytest 进行后端测试
- 测试覆盖率要求 > 80%
- 模拟外部 API 调用

### 5.2 集成测试
- 测试 API 端点
- 测试数据库操作
- 测试外部服务集成
- 测试错误处理

### 5.3 E2E 测试
- 使用 Cypress 进行 E2E 测试
- 测试关键用户流程
- 测试响应式设计
- 测试性能指标

## 6. 部署规范

### 6.1 Docker
- 使用多阶段构建
- 优化镜像大小
- 使用 Docker Compose
- 实现健康检查

### 6.2 环境配置
- 开发环境
- 测试环境
- 预发布环境
- 生产环境

### 6.3 监控告警
- 使用 Prometheus 监控
- 使用 Grafana 可视化
- 设置性能告警
- 设置错误告警

## 7. 安全规范

### 7.1 代码安全
- 定期依赖更新
- 代码安全扫描
- 敏感信息加密
- 输入验证

### 7.2 数据安全
- 数据加密存储
- 数据备份策略
- 访问权限控制
- 审计日志记录

### 7.3 API 安全
- API 认证授权
- 请求签名验证
- 防重放攻击
- 敏感数据脱敏

## 8. 性能优化

### 8.1 前端优化
- 代码分割
- 懒加载
- 缓存策略
- 资源压缩

### 8.2 后端优化
- 数据库优化
- 缓存使用
- 异步处理
- 负载均衡

## 9. 文档规范

### 9.1 代码文档
- 使用 JSDoc 注释
- 组件文档
- API 文档
- 类型定义文档

### 9.2 项目文档
- README 文件
- 架构文档
- 部署文档
- 用户指南

## 10. 版本控制

### 10.1 Git 工作流
- 主分支: main
- 开发分支: develop
- 功能分支: feature/*
- 发布分支: release/*
- 修复分支: hotfix/*

### 10.2 版本号规范
- 主版本号: 不兼容的 API 修改
- 次版本号: 向下兼容的功能性新增
- 修订号: 向下兼容的问题修正

### 10.3 发布流程
1. 版本号更新
2. 更新日志编写
3. 代码审查
4. 测试验证
5. 发布部署 