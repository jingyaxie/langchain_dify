import asyncio
import time
from typing import Optional, Dict, Any, List
from openai import AsyncOpenAI
import anthropic
from google.generativeai import GenerativeModel
import google.generativeai as genai
from .config import settings


class RateLimiter:
    """API 速率限制器"""
    
    def __init__(self, max_requests: int = 60, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
    
    async def acquire(self):
        """获取请求许可"""
        now = time.time()
        # 移除过期的请求记录
        self.requests = [req_time for req_time in self.requests 
                        if now - req_time < self.time_window]
        
        if len(self.requests) >= self.max_requests:
            # 等待直到可以发出请求
            sleep_time = self.time_window - (now - self.requests[0])
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
                return await self.acquire()
        
        self.requests.append(now)
        return True


class RetryManager:
    """重试管理器"""
    
    @staticmethod
    async def retry_with_backoff(
        func,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0
    ):
        """带退避的重试机制"""
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return await func()
            except Exception as e:
                last_exception = e
                
                if attempt == max_retries:
                    break
                
                delay = min(base_delay * (backoff_factor ** attempt), max_delay)
                await asyncio.sleep(delay)
        
        raise last_exception


class OpenAIClient:
    """OpenAI API 客户端"""
    
    def __init__(self):
        self.client = None
        self.rate_limiter = RateLimiter(max_requests=50, time_window=60)
        self._initialize_client()
    
    def _initialize_client(self):
        """初始化客户端"""
        if settings.openai_api_key:
            self.client = AsyncOpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_api_base
            )
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """聊天补全"""
        if not self.client:
            raise ValueError("OpenAI client not initialized. Please check API key.")
        
        await self.rate_limiter.acquire()
        
        async def _call():
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return {
                "content": response.choices[0].message.content,
                "usage": response.usage.dict() if response.usage else None,
                "model": response.model
            }
        
        return await RetryManager.retry_with_backoff(_call)
    
    async def get_embedding(
        self,
        text: str,
        model: str = "text-embedding-ada-002"
    ) -> List[float]:
        """获取文本嵌入向量"""
        if not self.client:
            raise ValueError("OpenAI client not initialized. Please check API key.")
        
        await self.rate_limiter.acquire()
        
        async def _call():
            response = await self.client.embeddings.create(
                model=model,
                input=text
            )
            return response.data[0].embedding
        
        return await RetryManager.retry_with_backoff(_call)


class AnthropicClient:
    """Anthropic API 客户端"""
    
    def __init__(self):
        self.client = None
        self.rate_limiter = RateLimiter(max_requests=50, time_window=60)
        self._initialize_client()
    
    def _initialize_client(self):
        """初始化客户端"""
        if settings.anthropic_api_key:
            self.client = anthropic.AsyncAnthropic(
                api_key=settings.anthropic_api_key
            )
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "claude-3-sonnet-20240229",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> Dict[str, Any]:
        """聊天补全"""
        if not self.client:
            raise ValueError("Anthropic client not initialized. Please check API key.")
        
        await self.rate_limiter.acquire()
        
        async def _call():
            response = await self.client.messages.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return {
                "content": response.content[0].text,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                },
                "model": response.model
            }
        
        return await RetryManager.retry_with_backoff(_call)


class GoogleClient:
    """Google Gemini API 客户端"""
    
    def __init__(self):
        self.client = None
        self.rate_limiter = RateLimiter(max_requests=50, time_window=60)
        self._initialize_client()
    
    def _initialize_client(self):
        """初始化客户端"""
        if settings.google_api_key:
            genai.configure(api_key=settings.google_api_key)
            self.client = GenerativeModel('gemini-pro')
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-pro",
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """聊天补全"""
        if not self.client:
            raise ValueError("Google client not initialized. Please check API key.")
        
        await self.rate_limiter.acquire()
        
        # 转换消息格式
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        
        async def _call():
            response = await asyncio.to_thread(
                self.client.generate_content,
                prompt,
                generation_config={'temperature': temperature}
            )
            return {
                "content": response.text,
                "usage": None,  # Google API 不返回详细使用信息
                "model": model
            }
        
        return await RetryManager.retry_with_backoff(_call)


class APIClientManager:
    """API 客户端管理器"""
    
    def __init__(self):
        self.openai_client = OpenAIClient()
        self.anthropic_client = AnthropicClient()
        self.google_client = GoogleClient()
    
    def get_client(self, provider: str):
        """获取指定提供商的客户端"""
        clients = {
            "openai": self.openai_client,
            "anthropic": self.anthropic_client,
            "google": self.google_client
        }
        
        client = clients.get(provider.lower())
        if not client:
            raise ValueError(f"Unsupported provider: {provider}")
        
        return client
    
    async def chat_completion(
        self,
        provider: str,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> Dict[str, Any]:
        """统一的聊天补全接口"""
        client = self.get_client(provider)
        return await client.chat_completion(messages, **kwargs)
    
    async def get_embedding(
        self,
        text: str,
        provider: str = "openai",
        **kwargs
    ) -> List[float]:
        """统一的嵌入向量接口"""
        if provider.lower() != "openai":
            raise ValueError("Currently only OpenAI embeddings are supported")
        
        return await self.openai_client.get_embedding(text, **kwargs)
    
    def get_available_providers(self) -> List[str]:
        """获取可用的提供商列表"""
        available = []
        
        if settings.openai_api_key:
            available.append("openai")
        if settings.anthropic_api_key:
            available.append("anthropic")
        if settings.google_api_key:
            available.append("google")
        
        return available
    
    def is_provider_available(self, provider: str) -> bool:
        """检查提供商是否可用"""
        return provider.lower() in self.get_available_providers()


# 全局客户端管理器实例
api_client_manager = APIClientManager()


def get_api_client_manager() -> APIClientManager:
    """获取API客户端管理器"""
    return api_client_manager 