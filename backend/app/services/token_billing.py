from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from ..models.token_usage import TokenUsage, TokenUsageResponse

class TokenBillingService:
    """Service for handling token billing"""
    
    def __init__(self, db: Session):
        self.db = db

    # Pricing per 1K tokens (example rates)
    PRICING = {
        "openai": {
            "gpt-3.5-turbo": {"prompt": 0.0015, "completion": 0.002},
            "gpt-4": {"prompt": 0.03, "completion": 0.06},
            "gpt-4-turbo": {"prompt": 0.01, "completion": 0.03},
        },
        "anthropic": {
            "claude-3-sonnet": {"prompt": 0.003, "completion": 0.015},
            "claude-3-haiku": {"prompt": 0.00025, "completion": 0.00125},
        }
    }

    def calculate_cost(self, provider: str, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate cost based on token usage"""
        if provider not in self.PRICING or model not in self.PRICING[provider]:
            return 0.0
        
        pricing = self.PRICING[provider][model]
        prompt_cost = (prompt_tokens / 1000) * pricing["prompt"]
        completion_cost = (completion_tokens / 1000) * pricing["completion"]
        return prompt_cost + completion_cost

    async def record_usage(
        self,
        user_id: str,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        operation: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TokenUsageResponse:
        """Record token usage for billing"""
        total_tokens = prompt_tokens + completion_tokens
        cost = self.calculate_cost(provider, model, prompt_tokens, completion_tokens)
        
        usage = TokenUsage(
            user_id=user_id,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            operation=operation,
            cost=cost,
            extra_data=json.dumps(metadata) if metadata else None
        )
        
        self.db.add(usage)
        self.db.commit()
        self.db.refresh(usage)
        
        return TokenUsageResponse.from_orm(usage)

    def get_user_usage(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get aggregated usage statistics for a user"""
        query = self.db.query(TokenUsage).filter(TokenUsage.user_id == user_id)
        
        if start_date:
            query = query.filter(TokenUsage.created_at >= start_date)
        if end_date:
            query = query.filter(TokenUsage.created_at <= end_date)
        
        # Aggregate statistics
        total_stats = query.with_entities(
            func.sum(TokenUsage.prompt_tokens).label('total_prompt_tokens'),
            func.sum(TokenUsage.completion_tokens).label('total_completion_tokens'),
            func.sum(TokenUsage.total_tokens).label('total_tokens'),
            func.sum(TokenUsage.cost).label('total_cost'),
            func.count(TokenUsage.id).label('total_requests')
        ).first()
        
        return {
            "user_id": user_id,
            "period": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            },
            "usage": {
                "total_prompt_tokens": total_stats.total_prompt_tokens or 0,
                "total_completion_tokens": total_stats.total_completion_tokens or 0,
                "total_tokens": total_stats.total_tokens or 0,
                "total_cost": float(total_stats.total_cost or 0),
                "total_requests": total_stats.total_requests or 0
            }
        }

    def get_usage_details(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[TokenUsageResponse]:
        """Get detailed usage records for a user"""
        query = self.db.query(TokenUsage).filter(TokenUsage.user_id == user_id)
        
        if start_date:
            query = query.filter(TokenUsage.created_at >= start_date)
        if end_date:
            query = query.filter(TokenUsage.created_at <= end_date)
        
        records = query.order_by(TokenUsage.created_at.desc()).offset(offset).limit(limit).all()
        
        return [TokenUsageResponse.from_orm(record) for record in records] 