from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel

class AgentConfig(BaseModel):
    name: str
    description: str
    system_prompt: str
    agent_type: str = "zero-shot-react-description"
    tools: List[str] = []
    temperature: float = 0.7
    knowledge_base: Optional[str] = None
    model_name: str = "gpt-3.5-turbo"
    max_tokens: Optional[int] = None

class BaseAgent:
    def __init__(
        self,
        config: AgentConfig,
        llm: Optional[BaseChatModel] = None,
        tools: Optional[List[Tool]] = None
    ):
        self.config = config
        self.llm = llm or ChatOpenAI(
            temperature=config.temperature,
            model=config.model_name,
            max_tokens=config.max_tokens
        )
        self.tools = tools or []
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

    async def run(self, input_text: str) -> str:
        """Run the agent with the given input."""
        try:
            # Simple implementation using the LLM directly
            response = await self.llm.agenerate([[{"role": "user", "content": input_text}]])
            return response.generations[0][0].text
        except Exception as e:
            return f"Error running agent: {str(e)}"

    def add_tool(self, tool: Tool) -> None:
        """Add a new tool to the agent."""
        self.tools.append(tool)

    def get_tools(self) -> List[Tool]:
        """Get all tools available to the agent."""
        return self.tools

    def get_memory(self) -> Dict[str, Any]:
        """Get the current conversation memory."""
        return self.memory.chat_memory.messages 