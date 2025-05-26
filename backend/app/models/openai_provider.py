from typing import List, Dict, Any, Optional
import openai
from .base import BaseModelProvider, ModelConfig, ModelResponse

class OpenAIProvider(BaseModelProvider):
    """OpenAI model provider implementation"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        openai.api_key = config.api_key
        if config.api_base:
            openai.api_base = config.api_base
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        config: ModelConfig,
        stream: bool = False
    ) -> ModelResponse:
        """Chat with OpenAI model"""
        try:
            response = await openai.ChatCompletion.acreate(
                model=config.model,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty,
                stop=config.stop_sequences,
                stream=stream
            )
            
            if stream:
                return response  # Return stream for handling
            
            return ModelResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage=response.usage.dict(),
                raw_response=response.dict()
            )
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> List[List[float]]:
        """Generate embeddings using OpenAI"""
        try:
            response = await openai.Embedding.acreate(
                input=texts,
                model=model or "text-embedding-ada-002"
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            raise Exception(f"OpenAI embedding error: {str(e)}")
    
    async def analyze_image(
        self,
        image_url: str,
        prompt: str,
        config: ModelConfig
    ) -> ModelResponse:
        """Analyze image using GPT-4 Vision"""
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": image_url
                            }
                        ]
                    }
                ],
                max_tokens=config.max_tokens
            )
            
            return ModelResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage=response.usage.dict(),
                raw_response=response.dict()
            )
        except Exception as e:
            raise Exception(f"OpenAI vision error: {str(e)}")
    
    async def transcribe_audio(
        self,
        audio_url: str,
        language: Optional[str] = None
    ) -> str:
        """Transcribe audio using Whisper"""
        try:
            response = await openai.Audio.transcribe(
                model="whisper-1",
                file=audio_url,
                language=language
            )
            return response.text
        except Exception as e:
            raise Exception(f"OpenAI transcription error: {str(e)}")
    
    def get_available_models(self) -> List[str]:
        """Get list of available OpenAI models"""
        return [
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4-vision-preview",
            "text-embedding-ada-002",
            "whisper-1"
        ]
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get model information"""
        model_info = {
            "gpt-3.5-turbo": {
                "name": "GPT-3.5 Turbo",
                "type": "chat",
                "max_tokens": 4096,
                "supports_streaming": True
            },
            "gpt-4": {
                "name": "GPT-4",
                "type": "chat",
                "max_tokens": 8192,
                "supports_streaming": True
            },
            "gpt-4-vision-preview": {
                "name": "GPT-4 Vision",
                "type": "vision",
                "max_tokens": 4096,
                "supports_streaming": False
            },
            "text-embedding-ada-002": {
                "name": "Text Embedding Ada",
                "type": "embedding",
                "dimensions": 1536
            },
            "whisper-1": {
                "name": "Whisper",
                "type": "audio",
                "supports_languages": True
            }
        }
        return model_info.get(model, {}) 