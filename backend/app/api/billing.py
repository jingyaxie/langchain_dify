from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.token_billing import TokenBillingService
from ..models.token_usage import TokenUsageCreate
from ..auth import get_current_user

router = APIRouter()

@router.get("/usage")
async def get_usage(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get token usage statistics for the current user"""
    billing_service = TokenBillingService(db)
    return billing_service.get_user_usage(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/usage/details")
async def get_usage_details(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed usage records for the current user"""
    billing_service = TokenBillingService(db)
    return billing_service.get_usage_details(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )

@router.post("/usage/record")
async def record_usage(
    usage: TokenUsageCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record token usage for the current user"""
    billing_service = TokenBillingService(db)
    return await billing_service.record_usage(
        user_id=current_user.id,
        provider=usage.provider,
        model=usage.model,
        prompt_tokens=usage.prompt_tokens,
        completion_tokens=usage.completion_tokens,
        operation=usage.operation,
        metadata=usage.metadata
    ) 