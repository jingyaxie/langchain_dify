from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import create_access_token, get_current_user, User
from datetime import timedelta
import uuid

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    用户登录
    """
    # 演示环境：接受任何用户名和密码
    # 在生产环境中，这里应该验证用户名和密码
    
    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名和密码不能为空"
        )
    
    # 创建模拟用户
    user = User(
        id=str(uuid.uuid4()),
        username=request.username,
        email=f"{request.username}@example.com"
    )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    用户注册
    """
    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名和密码不能为空"
        )
    
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码长度至少6个字符"
        )
    
    # 演示环境：直接创建用户
    # 在生产环境中，这里应该检查用户名是否已存在，加密密码等
    
    user = User(
        id=str(uuid.uuid4()),
        username=request.username,
        email=request.email or f"{request.username}@example.com"
    )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息
    """
    return current_user

@router.post("/logout")
async def logout():
    """
    用户登出
    """
    # 在JWT模式下，登出主要在前端处理（删除token）
    # 这里返回成功消息
    return {"message": "Successfully logged out"} 