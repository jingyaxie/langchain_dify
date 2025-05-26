from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.token_usage import TokenUsage, TokenUsageCreate
from ..models.user import User
import uuid

class TokenBillingService:
    """Service for handling token billing"""
    
    # Token costs per 1K tokens (in USD)
    TOKEN_COSTS = {
        "openai": {
            "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
            "gpt-4": {"input": 0.03, "output": 0.06},
            "gpt-4-vision-preview": {"input": 0.01, "output": 0.03},
            "text-embedding-ada-002": {"input": 0.0001, "output": 0},
        },
        "anthropic": {
            "claude-3-opus-20240229": {"input": 0.015, "output": 0.075},
            "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
            "claude-3-haiku-20240229": {"input": 0.00025, "output": 0.00125},
            "claude-3-vision-20240229": {"input": 0.01, "output": 0.03},
        },
        "google": {
            "gemini-pro": {"input": 0.00025, "output": 0.0005},
            "gemini-pro-vision": {"input": 0.00025, "output": 0.0005},
        }
    }

    def __init__(self, db: Session):
        self.db = db

    def calculate_cost(
        self,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int
    ) -> float:
        """Calculate cost for token usage"""
        if provider not in self.TOKEN_COSTS or model not in self.TOKEN_COSTS[provider]:
            raise ValueError(f"Unknown provider/model combination: {provider}/{model}")

        costs = self.TOKEN_COSTS[provider][model]
        input_cost = (prompt_tokens / 1000) * costs["input"]
        output_cost = (completion_tokens / 1000) * costs["output"]
        return input_cost + output_cost

    async def record_usage(
        self,
        user_id: int,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        operation: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TokenUsage:
        """Record token usage for a user"""
        total_tokens = prompt_tokens + completion_tokens
        cost = self.calculate_cost(provider, model, prompt_tokens, completion_tokens)
        
        usage = TokenUsageCreate(
            user_id=user_id,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost=cost,
            operation=operation,
            request_id=str(uuid.uuid4()),
            metadata=str(metadata) if metadata else None
        )
        
        db_usage = TokenUsage(**usage.dict())
        self.db.add(db_usage)
        self.db.commit()
        self.db.refresh(db_usage)
        
        return db_usage

    def get_user_usage(
        self,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get token usage statistics for a user"""
        query = self.db.query(TokenUsage).filter(TokenUsage.user_id == user_id)
        
        if start_date:
            query = query.filter(TokenUsage.timestamp >= start_date)
        if end_date:
            query = query.filter(TokenUsage.timestamp <= end_date)
            
        usages = query.all()
        
        # Calculate statistics
        total_cost = sum(usage.cost for usage in usages)
        total_tokens = sum(usage.total_tokens for usage in usages)
        
        # Group by provider and model
        provider_stats = {}
        for usage in usages:
            if usage.provider not in provider_stats:
                provider_stats[usage.provider] = {
                    "total_cost": 0,
                    "total_tokens": 0,
                    "models": {}
                }
            
            provider_stats[usage.provider]["total_cost"] += usage.cost
            provider_stats[usage.provider]["total_tokens"] += usage.total_tokens
            
            if usage.model not in provider_stats[usage.provider]["models"]:
                provider_stats[usage.provider]["models"][usage.model] = {
                    "total_cost": 0,
                    "total_tokens": 0,
                    "operations": {}
                }
            
            provider_stats[usage.provider]["models"][usage.model]["total_cost"] += usage.cost
            provider_stats[usage.provider]["models"][usage.model]["total_tokens"] += usage.total_tokens
            
            if usage.operation not in provider_stats[usage.provider]["models"][usage.model]["operations"]:
                provider_stats[usage.provider]["models"][usage.model]["operations"][usage.operation] = {
                    "total_cost": 0,
                    "total_tokens": 0,
                    "count": 0
                }
            
            op_stats = provider_stats[usage.provider]["models"][usage.model]["operations"][usage.operation]
            op_stats["total_cost"] += usage.cost
            op_stats["total_tokens"] += usage.total_tokens
            op_stats["count"] += 1
        
        return {
            "total_cost": total_cost,
            "total_tokens": total_tokens,
            "provider_stats": provider_stats,
            "period": {
                "start": start_date,
                "end": end_date
            }
        }

    def get_usage_details(
        self,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get detailed usage records for a user"""
        query = self.db.query(TokenUsage).filter(TokenUsage.user_id == user_id)
        
        if start_date:
            query = query.filter(TokenUsage.timestamp >= start_date)
        if end_date:
            query = query.filter(TokenUsage.timestamp <= end_date)
            
        total = query.count()
        records = query.order_by(TokenUsage.timestamp.desc()).offset(offset).limit(limit).all()
        
        return {
            "total": total,
            "records": records,
            "limit": limit,
            "offset": offset
        } 