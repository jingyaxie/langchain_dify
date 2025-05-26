import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)

@pytest.fixture
def test_agent_config():
    """Create a test agent configuration."""
    return {
        "name": "Test Assistant",
        "description": "A test assistant for testing purposes",
        "system_prompt": "You are a test assistant.",
        "tools": ["Search", "Wikipedia"],
        "temperature": 0.5
    }

@pytest.fixture
def test_knowledge_base_config():
    """Create a test agent configuration with knowledge base."""
    return {
        "name": "Knowledge Test",
        "description": "An agent with knowledge base",
        "system_prompt": "You are a knowledgeable test assistant.",
        "tools": ["Search"],
        "temperature": 0.7,
        "knowledge_base": "test_kb"
    } 