from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..models.config import ModelConfigManager, ModelProviderConfig, ModelSettings

router = APIRouter()
config_manager = ModelConfigManager()

@router.get("/providers")
async def get_providers():
    """Get all provider configurations"""
    return config_manager.get_all_providers()

@router.post("/providers")
async def update_providers(providers: Dict[str, ModelProviderConfig]):
    """Update provider configurations"""
    try:
        for name, config in providers.items():
            if name in config_manager.get_all_providers():
                config_manager.update_provider(name, config)
            else:
                config_manager.add_provider(name, config)
        return {"message": "Providers updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/models")
async def get_model_settings():
    """Get global model settings"""
    return config_manager.get_settings()

@router.post("/models")
async def update_model_settings(settings: ModelSettings):
    """Update global model settings"""
    try:
        config_manager.update_settings(settings)
        return {"message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 