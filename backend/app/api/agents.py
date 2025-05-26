from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..agents.agent_config import AgentManager, AgentConfig
from ..agents.base import BaseAgent

router = APIRouter()
agent_manager = AgentManager()

class AgentResponse(BaseModel):
    id: str
    name: str
    description: str
    tools: List[str]
    temperature: float

class CreateAgentRequest(BaseModel):
    name: str
    description: str
    system_prompt: str
    tools: List[str] = []
    temperature: float = 0.7
    knowledge_base: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

@router.get("/agents", response_model=List[AgentResponse])
async def list_agents():
    """List all available agents."""
    return agent_manager.list_agents()

@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """Get agent details by ID."""
    agent = agent_manager.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {
        "id": agent_id,
        "name": agent.config.name,
        "description": agent.config.description,
        "tools": agent.config.tools,
        "temperature": agent.config.temperature
    }

@router.post("/agents", response_model=AgentResponse)
async def create_agent(request: CreateAgentRequest):
    """Create a new agent."""
    config = AgentConfig(
        name=request.name,
        description=request.description,
        system_prompt=request.system_prompt,
        tools=request.tools,
        temperature=request.temperature,
        knowledge_base=request.knowledge_base
    )
    agent = agent_manager.create_agent(request.name.lower().replace(" ", "_"), config)
    return {
        "id": request.name.lower().replace(" ", "_"),
        "name": agent.config.name,
        "description": agent.config.description,
        "tools": agent.config.tools,
        "temperature": agent.config.temperature
    }

@router.put("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, request: CreateAgentRequest):
    """Update an existing agent."""
    config = AgentConfig(
        name=request.name,
        description=request.description,
        system_prompt=request.system_prompt,
        tools=request.tools,
        temperature=request.temperature,
        knowledge_base=request.knowledge_base
    )
    agent = agent_manager.update_agent(agent_id, config)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {
        "id": agent_id,
        "name": agent.config.name,
        "description": agent.config.description,
        "tools": agent.config.tools,
        "temperature": agent.config.temperature
    }

@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent."""
    if not agent_manager.delete_agent(agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}

@router.post("/agents/{agent_id}/chat")
async def chat_with_agent(agent_id: str, request: ChatRequest):
    """Chat with an agent."""
    agent = agent_manager.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        response = await agent.run(request.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 