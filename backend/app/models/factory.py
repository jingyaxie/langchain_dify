from typing import Dict, Type, Optional
from .base import BaseModelProvider, ModelConfig
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .azure_provider import AzureProvider
from .gemini_provider import GeminiProvider
from .qwen_provider import QwenProvider
from .spark_provider import SparkProvider

class ModelFactory:
    """Factory class for creating model providers"""
    
    _providers: Dict[str, Type[BaseModelProvider]] = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "gemini": GeminiProvider
    }
    
    @classmethod
    def create_provider(cls, provider_name: str, config: ModelConfig) -> BaseModelProvider:
        """Create a model provider instance"""
        provider_class = cls._providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")
        return provider_class(config)
    
    @classmethod
    def register_provider(cls, name: str, provider_class: Type[BaseModelProvider]) -> None:
        """Register a new model provider"""
        cls._providers[name.lower()] = provider_class
    
    @classmethod
    def get_available_providers(cls) -> Dict[str, Type[BaseModelProvider]]:
        """Get all available providers"""
        return cls._providers.copy()
    
    @classmethod
    def get_provider_info(cls, provider_name: str) -> Optional[Dict]:
        """Get provider information"""
        provider_class = cls._providers.get(provider_name.lower())
        if not provider_class:
            return None
            
        # Create a temporary instance to get model info
        temp_config = ModelConfig(
            api_key="dummy",
            model="dummy"
        )
        provider = provider_class(temp_config)
        
        return {
            "name": provider_name,
            "available_models": provider.get_available_models(),
            "model_info": {
                model: provider.get_model_info(model)
                for model in provider.get_available_models()
            }
        } 