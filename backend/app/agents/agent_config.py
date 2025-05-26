from typing import Dict, List, Optional
from pydantic import BaseModel
from langchain.agents import AgentType
from .base import AgentConfig, BaseAgent
from .tools import get_default_tools, get_tool_by_name, KnowledgeBaseTool
from ..vectorstore.chroma_store import ChromaStore

class AgentManager:
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.vector_store = ChromaStore()
        self._initialize_default_agents()

    def _initialize_default_agents(self):
        """Initialize default agent configurations."""
        default_configs = {
            "general": AgentConfig(
                name="General Assistant",
                description="A general-purpose assistant that can help with various tasks",
                system_prompt="You are a helpful AI assistant that can help with various tasks.",
                agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                tools=["Search", "Wikipedia", "Python"],
                temperature=0.7
            ),
            "expert": AgentConfig(
                name="Expert Assistant",
                description="An expert assistant specialized in technical and research tasks",
                system_prompt="You are an expert AI assistant specialized in technical and research tasks.",
                agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                tools=["Search", "Wikipedia", "Arxiv", "PubMed", "Python"],
                temperature=0.3
            ),
            "creative": AgentConfig(
                name="Creative Assistant",
                description="A creative assistant for generating ideas and content",
                system_prompt="You are a creative AI assistant that helps generate ideas and content.",
                agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                tools=["Search", "Wikipedia", "Python"],
                temperature=0.9
            )
        }

        for agent_id, config in default_configs.items():
            self.create_agent(agent_id, config)

    def create_agent(self, agent_id: str, config: AgentConfig) -> BaseAgent:
        """Create a new agent with the given configuration."""
        # Get tools based on configuration
        tools = []
        for tool_name in config.tools:
            tool = get_tool_by_name(tool_name)
            if tool:
                tools.append(tool)

        # Add knowledge base tool if specified
        if config.knowledge_base:
            kb_tool = KnowledgeBaseTool(
                self.vector_store.create_collection(config.knowledge_base)
            )
            tools.append(kb_tool)

        # Create and store the agent
        agent = BaseAgent(config=config, tools=tools)
        self.agents[agent_id] = agent
        return agent

    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID."""
        return self.agents.get(agent_id)

    def list_agents(self) -> List[Dict]:
        """List all available agents."""
        return [
            {
                "id": agent_id,
                "name": agent.config.name,
                "description": agent.config.description,
                "tools": agent.config.tools,
                "temperature": agent.config.temperature
            }
            for agent_id, agent in self.agents.items()
        ]

    def update_agent(self, agent_id: str, config: AgentConfig) -> Optional[BaseAgent]:
        """Update an existing agent's configuration."""
        if agent_id in self.agents:
            return self.create_agent(agent_id, config)
        return None

    def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent."""
        if agent_id in self.agents:
            del self.agents[agent_id]
            return True
        return False 