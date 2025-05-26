from typing import List, Dict, Any, Optional
import anthropic
from .base import BaseModelProvider, ModelConfig, ModelResponse

class AnthropicProvider(BaseModelProvider):
    """Anthropic model provider implementation"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.client = anthropic.Anthropic(api_key=config.api_key)
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        config: ModelConfig,
        stream: bool = False
    ) -> ModelResponse:
        """Chat with Claude model"""
        try:
            # Convert messages to Anthropic format
            prompt = self._convert_messages_to_prompt(messages)
            
            response = await self.client.messages.create(
                model=config.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                stream=stream
            )
            
            if stream:
                return response  # Return stream for handling
            
            return ModelResponse(
                content=response.content[0].text,
                model=response.model,
                usage={
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                },
                raw_response=response.dict()
            )
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> List[List[float]]:
        """Generate embeddings using Claude"""
        try:
            embeddings = []
            for text in texts:
                response = await self.client.embeddings.create(
                    model=model or "claude-3-sonnet-20240229",
                    input=text
                )
                embeddings.append(response.embedding)
            return embeddings
        except Exception as e:
            raise Exception(f"Anthropic embedding error: {str(e)}")
    
    async def analyze_image(
        self,
        image_url: str,
        prompt: str,
        config: ModelConfig
    ) -> ModelResponse:
        """Analyze image using Claude Vision"""
        try:
            response = await self.client.messages.create(
                model="claude-3-vision-20240229",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image",
                                "source": {
                                    "type": "url",
                                    "url": image_url
                                }
                            }
                        ]
                    }
                ],
                max_tokens=config.max_tokens
            )
            
            return ModelResponse(
                content=response.content[0].text,
                model=response.model,
                usage={
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                },
                raw_response=response.dict()
            )
        except Exception as e:
            raise Exception(f"Anthropic vision error: {str(e)}")
    
    async def transcribe_audio(
        self,
        audio_url: str,
        language: Optional[str] = None
    ) -> str:
        """Transcribe audio using Claude"""
        raise NotImplementedError("Audio transcription not supported by Anthropic")
    
    def get_available_models(self) -> List[str]:
        """Get list of available Anthropic models"""
        return [
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240229",
            "claude-3-vision-20240229"
        ]
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get model information"""
        model_info = {
            "claude-3-opus-20240229": {
                "name": "Claude 3 Opus",
                "type": "chat",
                "max_tokens": 200000,
                "supports_streaming": True
            },
            "claude-3-sonnet-20240229": {
                "name": "Claude 3 Sonnet",
                "type": "chat",
                "max_tokens": 200000,
                "supports_streaming": True
            },
            "claude-3-haiku-20240229": {
                "name": "Claude 3 Haiku",
                "type": "chat",
                "max_tokens": 200000,
                "supports_streaming": True
            },
            "claude-3-vision-20240229": {
                "name": "Claude 3 Vision",
                "type": "vision",
                "max_tokens": 200000,
                "supports_streaming": True
            }
        }
        return model_info.get(model, {})
    
    def _convert_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Convert chat messages to Anthropic prompt format"""
        prompt = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                prompt += f"System: {content}\n\n"
            elif role == "user":
                prompt += f"Human: {content}\n\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n\n"
        return prompt.strip() 