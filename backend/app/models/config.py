from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import json
import os
from pathlib import Path

class ModelProviderConfig(BaseModel):
    """Configuration for a model provider"""
    api_key: str
    api_base: Optional[str] = None
    api_version: Optional[str] = None
    default_model: str
    embedding_model: Optional[str] = None
    available_models: List[str] = Field(default_factory=list)

class ModelSettings(BaseModel):
    """Global model settings"""
    default_provider: str = "openai"
    default_model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: int = 2000
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    stop_sequences: Optional[List[str]] = None

class ModelConfigManager:
    """Manager for model configurations"""
    
    def __init__(self, config_dir: str = "config"):
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(exist_ok=True)
        
        self.providers: Dict[str, ModelProviderConfig] = {}
        self.settings = ModelSettings()
        
        self.load_config()
    
    def load_config(self):
        """Load configuration from files"""
        # Load provider configs
        providers_file = self.config_dir / "providers.json"
        if providers_file.exists():
            with open(providers_file) as f:
                data = json.load(f)
                self.providers = {
                    name: ModelProviderConfig(**config)
                    for name, config in data.items()
                }
        
        # Load settings
        settings_file = self.config_dir / "settings.json"
        if settings_file.exists():
            with open(settings_file) as f:
                self.settings = ModelSettings(**json.load(f))
    
    def save_config(self):
        """Save configuration to files"""
        # Save provider configs
        providers_file = self.config_dir / "providers.json"
        with open(providers_file, "w") as f:
            json.dump(
                {
                    name: config.dict()
                    for name, config in self.providers.items()
                },
                f,
                indent=2
            )
        
        # Save settings
        settings_file = self.config_dir / "settings.json"
        with open(settings_file, "w") as f:
            json.dump(self.settings.dict(), f, indent=2)
    
    def add_provider(self, name: str, config: ModelProviderConfig):
        """Add a new provider configuration"""
        self.providers[name] = config
        self.save_config()
    
    def update_provider(self, name: str, config: ModelProviderConfig):
        """Update an existing provider configuration"""
        if name not in self.providers:
            raise ValueError(f"Provider {name} not found")
        self.providers[name] = config
        self.save_config()
    
    def remove_provider(self, name: str):
        """Remove a provider configuration"""
        if name in self.providers:
            del self.providers[name]
            self.save_config()
    
    def get_provider(self, name: str) -> Optional[ModelProviderConfig]:
        """Get provider configuration"""
        return self.providers.get(name)
    
    def get_all_providers(self) -> Dict[str, ModelProviderConfig]:
        """Get all provider configurations"""
        return self.providers.copy()
    
    def update_settings(self, settings: ModelSettings):
        """Update global settings"""
        self.settings = settings
        self.save_config()
    
    def get_settings(self) -> ModelSettings:
        """Get global settings"""
        return self.settings 