from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from ..agents.agent_config import AgentConfig, AgentManager

router = APIRouter()
agent_manager = AgentManager()

class AgentResponse(BaseModel):
    id: str
    config: AgentConfig

@router.get("/", response_model=Dict[str, AgentConfig])
async def list_agents():
    """List all available agents"""
    return agent_manager.list_agents()

@router.get("/{agent_id}", response_model=AgentConfig)
async def get_agent(agent_id: str):
    """Get agent configuration by ID"""
    agent = agent_manager.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    return agent

@router.post("/{agent_id}", response_model=AgentResponse)
async def create_agent(agent_id: str, config: AgentConfig):
    """Create a new agent configuration"""
    try:
        agent_manager.create_agent(agent_id, config)
        return {"id": agent_id, "config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, config: AgentConfig):
    """Update an existing agent configuration"""
    try:
        agent_manager.update_agent(agent_id, config)
        return {"id": agent_id, "config": config}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent configuration"""
    try:
        agent_manager.delete_agent(agent_id)
        return {"message": f"Agent {agent_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 