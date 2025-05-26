from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel

class AgentConfig(BaseModel):
    name: str
    description: str
    system_prompt: str
    agent_type: AgentType = AgentType.ZERO_SHOT_REACT_DESCRIPTION
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
            model_name=config.model_name,
            max_tokens=config.max_tokens
        )
        self.tools = tools or []
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.agent = self._create_agent()

    def _create_agent(self) -> Any:
        """Create and initialize the LangChain agent."""
        return initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=self.config.agent_type,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True
        )

    async def run(self, input_text: str) -> str:
        """Run the agent with the given input."""
        try:
            response = await self.agent.arun(input_text)
            return response
        except Exception as e:
            return f"Error running agent: {str(e)}"

    def add_tool(self, tool: Tool) -> None:
        """Add a new tool to the agent."""
        self.tools.append(tool)
        self.agent = self._create_agent()

    def get_tools(self) -> List[Tool]:
        """Get all tools available to the agent."""
        return self.tools

    def get_memory(self) -> Dict[str, Any]:
        """Get the current conversation memory."""
        return self.memory.chat_memory.messages 