# LangChain Dify Clone

A LangChain-based alternative to Dify, providing a powerful platform for building and deploying AI agents with knowledge bases.

## Features

- 🤖 Multiple AI agent configurations with customizable prompts
- 📚 Knowledge base management with support for PDF, DOCX, and TXT files
- 🔍 Semantic search using ChromaDB vector store
- 💬 Chat interface with conversation history
- 🐳 Docker-based deployment

## Prerequisites

- Docker and Docker Compose
- OpenAI API key

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/langchain_dify_clone.git
cd langchain_dify_clone
```

2. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key
```

3. Start the services:
```bash
docker-compose up --build
```

4. Access the services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- ChromaDB: http://localhost:8001

## API Endpoints

### Chat API
- `POST /api/chat/message` - Send a message to the chat
- `DELETE /api/chat/conversation/{conversation_id}` - Delete a conversation

### Knowledge Base API
- `POST /api/knowledge/upload/{collection_name}` - Upload a document
- `POST /api/knowledge/search` - Search the knowledge base

### Agents API
- `GET /api/agents` - List all agents
- `GET /api/agents/{agent_id}` - Get agent configuration
- `POST /api/agents/{agent_id}` - Create new agent
- `PUT /api/agents/{agent_id}` - Update agent
- `DELETE /api/agents/{agent_id}` - Delete agent

## Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
langchain_dify_clone/
├── backend/                # Backend service (FastAPI + LangChain)
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── agents/        # Agent configurations
│   │   ├── knowledge/     # Knowledge base management
│   │   ├── services/      # LangChain services
│   │   ├── vectorstore/   # Vector store utilities
│   │   └── main.py        # FastAPI application
│   └── requirements.txt   # Python dependencies
├── frontend/              # Frontend application
├── docker-compose.yml     # Docker configuration
└── README.md             # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 