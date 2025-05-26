from typing import Dict, List, Optional
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    description: str
    system_prompt: str
    tools: List[str] = []
    temperature: float = 0.7
    knowledge_base: Optional[str] = None

# Default agent configurations
DEFAULT_AGENTS = {
    "general": AgentConfig(
        name="General Assistant",
        description="A helpful AI assistant for general questions",
        system_prompt="""You are a helpful AI assistant. You provide accurate and concise answers to questions.
        If you don't know something, you admit it. You maintain a professional and friendly tone.""",
        temperature=0.7
    ),
    "expert": AgentConfig(
        name="Expert Assistant",
        description="An expert AI assistant with deep knowledge in specific domains",
        system_prompt="""You are an expert AI assistant with deep knowledge in various domains.
        You provide detailed and well-reasoned answers, citing sources when possible.
        You maintain a professional and authoritative tone.""",
        temperature=0.5
    ),
    "creative": AgentConfig(
        name="Creative Assistant",
        description="A creative AI assistant for brainstorming and ideation",
        system_prompt="""You are a creative AI assistant focused on generating innovative ideas and solutions.
        You think outside the box and encourage creative thinking.
        You maintain an enthusiastic and inspiring tone.""",
        temperature=0.9
    )
}

class AgentManager:
    def __init__(self):
        self.agents = DEFAULT_AGENTS.copy()
        
    def get_agent(self, agent_id: str) -> Optional[AgentConfig]:
        """Get agent configuration by ID"""
        return self.agents.get(agent_id)
        
    def create_agent(self, agent_id: str, config: AgentConfig):
        """Create a new agent configuration"""
        self.agents[agent_id] = config
        
    def update_agent(self, agent_id: str, config: AgentConfig):
        """Update an existing agent configuration"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        self.agents[agent_id] = config
        
    def delete_agent(self, agent_id: str):
        """Delete an agent configuration"""
        if agent_id in self.agents:
            del self.agents[agent_id]
            
    def list_agents(self) -> Dict[str, AgentConfig]:
        """List all agent configurations"""
        return self.agents 