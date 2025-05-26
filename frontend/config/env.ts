// API 配置
export const API_CONFIG = {
  // API 基础 URL
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // API 超时设置（毫秒）
  TIMEOUT: 30000,
  
  // API 重试配置
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_CONDITIONS: ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET'],
  },
  
  // API 限流配置
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000, // 1分钟
  },
};

// 大模型 API 配置
export const LLM_CONFIG = {
  // OpenAI 配置
  OPENAI: {
    API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    API_BASE: process.env.NEXT_PUBLIC_OPENAI_API_BASE || 'https://api.openai.com/v1',
    DEFAULT_MODEL: 'gpt-3.5-turbo',
    EMBEDDING_MODEL: 'text-embedding-ada-002',
  },
  
  // Azure OpenAI 配置
  AZURE: {
    API_KEY: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY,
    API_BASE: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_BASE,
    API_VERSION: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2023-05-15',
    DEFAULT_MODEL: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME,
    EMBEDDING_MODEL: process.env.NEXT_PUBLIC_AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
  },
  
  // Anthropic 配置
  ANTHROPIC: {
    API_KEY: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    API_BASE: process.env.NEXT_PUBLIC_ANTHROPIC_API_BASE || 'https://api.anthropic.com/v1',
    DEFAULT_MODEL: 'claude-2',
  },
};

// 文档处理配置
export const DOCUMENT_CONFIG = {
  // 文件大小限制（字节）
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // 支持的文件类型
  SUPPORTED_TYPES: {
    TEXT: ['.txt', '.md', '.markdown'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    DOCUMENT: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    VIDEO: ['.mp4', '.webm', '.ogg'],
  },
  
  // 文本分块配置
  CHUNK: {
    DEFAULT_SIZE: 1000,
    DEFAULT_OVERLAP: 200,
    MIN_SIZE: 100,
    MAX_SIZE: 2000,
  },
  
  // 向量化配置
  EMBEDDING: {
    MODEL: 'text-embedding-ada-002',
    DIMENSIONS: 1536,
  },
  
  // 添加新的配置项
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  
  // 添加所有支持的文件类型数组
  ALL_SUPPORTED_TYPES: [
    '.txt', '.md', '.markdown',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.mp4', '.webm', '.ogg',
  ],
};

// 缓存配置
export const CACHE_CONFIG = {
  // 本地存储键前缀
  STORAGE_PREFIX: 'langchain_dify_',
  
  // 缓存过期时间（毫秒）
  EXPIRATION: {
    SHORT: 5 * 60 * 1000, // 5分钟
    MEDIUM: 30 * 60 * 1000, // 30分钟
    LONG: 24 * 60 * 60 * 1000, // 24小时
  },
};

// 认证配置
export const AUTH_CONFIG = {
  // JWT 配置
  JWT: {
    TOKEN_KEY: 'auth_token',
    REFRESH_KEY: 'refresh_token',
    EXPIRES_IN: 24 * 60 * 60 * 1000, // 24小时
  },
  
  // 权限配置
  PERMISSIONS: {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest',
  },
};

// 主题配置
export const THEME_CONFIG = {
  // 颜色模式
  COLOR_MODE: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  
  // 主题色
  COLORS: {
    PRIMARY: 'blue',
    SECONDARY: 'gray',
    SUCCESS: 'green',
    ERROR: 'red',
    WARNING: 'yellow',
  },
}; 