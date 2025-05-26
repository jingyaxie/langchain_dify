import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agents.agent_config import AgentManager, AgentConfig
from app.agents.base import BaseAgent
from app.agents.tools import get_default_tools

client = TestClient(app)

def test_list_agents():
    """Test listing all available agents."""
    response = client.get("/agents")
    assert response.status_code == 200
    agents = response.json()
    assert len(agents) > 0
    assert all(isinstance(agent, dict) for agent in agents)
    assert all("id" in agent for agent in agents)
    assert all("name" in agent for agent in agents)
    assert all("description" in agent for agent in agents)
    assert all("tools" in agent for agent in agents)
    assert all("temperature" in agent for agent in agents)

def test_get_agent():
    """Test getting a specific agent."""
    # First get the list of agents
    response = client.get("/agents")
    agents = response.json()
    agent_id = agents[0]["id"]
    
    # Then get the specific agent
    response = client.get(f"/agents/{agent_id}")
    assert response.status_code == 200
    agent = response.json()
    assert agent["id"] == agent_id
    assert "name" in agent
    assert "description" in agent
    assert "tools" in agent
    assert "temperature" in agent

def test_create_agent():
    """Test creating a new agent."""
    new_agent = {
        "name": "Test Assistant",
        "description": "A test assistant for testing purposes",
        "system_prompt": "You are a test assistant.",
        "tools": ["Search", "Wikipedia"],
        "temperature": 0.5
    }
    
    response = client.post("/agents", json=new_agent)
    assert response.status_code == 200
    created_agent = response.json()
    assert created_agent["name"] == new_agent["name"]
    assert created_agent["description"] == new_agent["description"]
    assert created_agent["tools"] == new_agent["tools"]
    assert created_agent["temperature"] == new_agent["temperature"]

def test_update_agent():
    """Test updating an existing agent."""
    # First create an agent
    new_agent = {
        "name": "Update Test",
        "description": "An agent for testing updates",
        "system_prompt": "You are a test assistant.",
        "tools": ["Search"],
        "temperature": 0.5
    }
    
    response = client.post("/agents", json=new_agent)
    agent_id = response.json()["id"]
    
    # Then update it
    updated_agent = {
        "name": "Updated Test",
        "description": "An updated test assistant",
        "system_prompt": "You are an updated test assistant.",
        "tools": ["Search", "Wikipedia"],
        "temperature": 0.7
    }
    
    response = client.put(f"/agents/{agent_id}", json=updated_agent)
    assert response.status_code == 200
    updated = response.json()
    assert updated["name"] == updated_agent["name"]
    assert updated["description"] == updated_agent["description"]
    assert updated["tools"] == updated_agent["tools"]
    assert updated["temperature"] == updated_agent["temperature"]

def test_delete_agent():
    """Test deleting an agent."""
    # First create an agent
    new_agent = {
        "name": "Delete Test",
        "description": "An agent for testing deletion",
        "system_prompt": "You are a test assistant.",
        "tools": ["Search"],
        "temperature": 0.5
    }
    
    response = client.post("/agents", json=new_agent)
    agent_id = response.json()["id"]
    
    # Then delete it
    response = client.delete(f"/agents/{agent_id}")
    assert response.status_code == 200
    
    # Verify it's deleted
    response = client.get(f"/agents/{agent_id}")
    assert response.status_code == 404

def test_chat_with_agent():
    """Test chatting with an agent."""
    # First create an agent
    new_agent = {
        "name": "Chat Test",
        "description": "An agent for testing chat",
        "system_prompt": "You are a helpful test assistant.",
        "tools": ["Search", "Wikipedia"],
        "temperature": 0.7
    }
    
    response = client.post("/agents", json=new_agent)
    agent_id = response.json()["id"]
    
    # Then chat with it
    chat_request = {
        "message": "What is the capital of France?"
    }
    
    response = client.post(f"/agents/{agent_id}/chat", json=chat_request)
    assert response.status_code == 200
    chat_response = response.json()
    assert "response" in chat_response
    assert isinstance(chat_response["response"], str)
    assert len(chat_response["response"]) > 0

def test_agent_with_knowledge_base():
    """Test creating an agent with a knowledge base."""
    new_agent = {
        "name": "Knowledge Test",
        "description": "An agent with knowledge base",
        "system_prompt": "You are a knowledgeable test assistant.",
        "tools": ["Search"],
        "temperature": 0.7,
        "knowledge_base": "test_kb"
    }
    
    response = client.post("/agents", json=new_agent)
    assert response.status_code == 200
    created_agent = response.json()
    assert created_agent["name"] == new_agent["name"]
    
    # Test chat with knowledge base
    chat_request = {
        "message": "What do you know about the test knowledge base?"
    }
    
    response = client.post(f"/agents/{created_agent['id']}/chat", json=chat_request)
    assert response.status_code == 200
    chat_response = response.json()
    assert "response" in chat_response
    