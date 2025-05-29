from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from ..database import Base

class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    provider = Column(String, nullable=False)  # openai, anthropic, etc.
    model = Column(String, nullable=False)     # gpt-3.5-turbo, gpt-4, etc.
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    operation = Column(String)  # chat, embedding, etc.
    cost = Column(Float, default=0.0)
    extra_data = Column(Text)  # JSON string for additional data (renamed from metadata)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TokenUsageCreate(BaseModel):
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    operation: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class TokenUsageResponse(BaseModel):
    id: int
    user_id: str
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    operation: Optional[str]
    cost: float
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True 