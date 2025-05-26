from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ModelConfig(BaseModel):
    """Model configuration"""
    api_key: str
    api_base: Optional[str] = None
    api_version: Optional[str] = None
    model: str
    temperature: float = 0.7
    max_tokens: int = 2000
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    stop_sequences: Optional[List[str]] = None

class ModelResponse(BaseModel):
    """Model response"""
    content: str
    model: str
    usage: Dict[str, Any]
    raw_response: Dict[str, Any]

class BaseModelProvider(ABC):
    """Base class for model providers"""
    
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        config: ModelConfig,
        stream: bool = False
    ) -> ModelResponse:
        """Chat with model"""
        pass
    
    @abstractmethod
    async def generate_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> List[List[float]]:
        """Generate embeddings"""
        pass
    
    @abstractmethod
    async def analyze_image(
        self,
        image_url: str,
        prompt: str,
        config: ModelConfig
    ) -> ModelResponse:
        """Analyze image"""
        pass
    
    @abstractmethod
    async def transcribe_audio(
        self,
        audio_url: str,
        language: Optional[str] = None
    ) -> str:
        """Transcribe audio"""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        pass
    
    @abstractmethod
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get model information"""
        pass 