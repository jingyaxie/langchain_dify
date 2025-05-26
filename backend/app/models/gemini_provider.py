from typing import List, Dict, Any, Optional
import google.generativeai as genai
from .base import BaseModelProvider, ModelConfig, ModelResponse

class GeminiProvider(BaseModelProvider):
    """Google Gemini model provider implementation"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        genai.configure(api_key=config.api_key)
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        config: ModelConfig,
        stream: bool = False
    ) -> ModelResponse:
        """Chat with Gemini model"""
        try:
            model = genai.GenerativeModel(config.model)
            chat = model.start_chat(history=[])
            
            # Convert messages to Gemini format
            for msg in messages:
                if msg["role"] == "user":
                    chat.send_message(msg["content"])
                elif msg["role"] == "assistant":
                    # Add assistant message to history
                    chat.history.append({
                        "role": "model",
                        "parts": [msg["content"]]
                    })
            
            response = await chat.send_message_async(
                messages[-1]["content"],
                generation_config=genai.types.GenerationConfig(
                    temperature=config.temperature,
                    max_output_tokens=config.max_tokens,
                    top_p=config.top_p,
                    stop_sequences=config.stop_sequences
                ),
                stream=stream
            )
            
            if stream:
                return response  # Return stream for handling
            
            return ModelResponse(
                content=response.text,
                model=config.model,
                usage={
                    "prompt_tokens": response.prompt_token_count,
                    "completion_tokens": response.candidates[0].token_count,
                    "total_tokens": response.prompt_token_count + response.candidates[0].token_count
                },
                raw_response=response.to_dict()
            )
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> List[List[float]]:
        """Generate embeddings using Gemini"""
        try:
            model = genai.GenerativeModel(model or "embedding-001")
            embeddings = []
            for text in texts:
                result = await model.embed_content_async(text)
                embeddings.append(result.embedding)
            return embeddings
        except Exception as e:
            raise Exception(f"Gemini embedding error: {str(e)}")
    
    async def analyze_image(
        self,
        image_url: str,
        prompt: str,
        config: ModelConfig
    ) -> ModelResponse:
        """Analyze image using Gemini Vision"""
        try:
            model = genai.GenerativeModel("gemini-pro-vision")
            
            # Load image from URL
            image = genai.upload_file(image_url)
            
            response = await model.generate_content_async(
                [prompt, image],
                generation_config=genai.types.GenerationConfig(
                    temperature=config.temperature,
                    max_output_tokens=config.max_tokens,
                    top_p=config.top_p
                )
            )
            
            return ModelResponse(
                content=response.text,
                model="gemini-pro-vision",
                usage={
                    "prompt_tokens": response.prompt_token_count,
                    "completion_tokens": response.candidates[0].token_count,
                    "total_tokens": response.prompt_token_count + response.candidates[0].token_count
                },
                raw_response=response.to_dict()
            )
        except Exception as e:
            raise Exception(f"Gemini vision error: {str(e)}")
    
    async def transcribe_audio(
        self,
        audio_url: str,
        language: Optional[str] = None
    ) -> str:
        """Transcribe audio using Gemini"""
        raise NotImplementedError("Audio transcription not supported by Gemini")
    
    def get_available_models(self) -> List[str]:
        """Get list of available Gemini models"""
        return [
            "gemini-pro",
            "gemini-pro-vision",
            "embedding-001"
        ]
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get model information"""
        model_info = {
            "gemini-pro": {
                "name": "Gemini Pro",
                "type": "chat",
                "max_tokens": 32768,
                "supports_streaming": True
            },
            "gemini-pro-vision": {
                "name": "Gemini Pro Vision",
                "type": "vision",
                "max_tokens": 32768,
                "supports_streaming": True
            },
            "embedding-001": {
                "name": "Gemini Embedding",
                "type": "embedding",
                "dimensions": 768
            }
        }
        return model_info.get(model, {}) 