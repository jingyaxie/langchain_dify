import os
from typing import Optional, List
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """应用配置设置"""
    
    # 基础配置
    app_name: str = "LangChain Dify Clone"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # API 配置
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    
    # 大模型 API 配置
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_api_base: Optional[str] = Field(default=None, env="OPENAI_API_BASE")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    google_api_key: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")
    
    # 数据库配置
    database_url: str = Field(
        default="sqlite:///./langchain_dify.db", 
        env="DATABASE_URL"
    )
    
    # ChromaDB 配置
    chroma_persist_directory: str = Field(
        default="./chroma_data", 
        env="CHROMA_PERSIST_DIRECTORY"
    )
    chroma_collection_name: str = Field(
        default="knowledge_base", 
        env="CHROMA_COLLECTION_NAME"
    )
    
    # 文档处理配置
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")
    max_file_size: int = Field(default=10 * 1024 * 1024, env="MAX_FILE_SIZE")  # 10MB
    allowed_file_types: List[str] = Field(
        default=["pdf", "docx", "txt", "md"],
        env="ALLOWED_FILE_TYPES"
    )
    
    # 安全配置
    secret_key: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    access_token_expire_minutes: int = Field(
        default=30,
        env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    
    # CORS 配置
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        env="ALLOWED_ORIGINS"
    )
    
    # 日志配置
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: Optional[str] = Field(default=None, env="LOG_FILE")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# 全局设置实例
settings = Settings()


def get_settings() -> Settings:
    """获取应用设置"""
    return settings 