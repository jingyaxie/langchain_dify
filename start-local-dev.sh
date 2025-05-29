#!/bin/bash

# LangChain Dify Local Development Startup Script
# This script starts both backend and frontend services for local development

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting LangChain Dify Local Development Environment${NC}"
echo

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Check system requirements
echo -e "${BLUE}📋 Checking system requirements...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ System requirements met${NC}"
echo

# Setup Python backend
echo -e "${BLUE}🐍 Setting up Python backend...${NC}"
cd backend

# Check and create virtual environment
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if requirements are installed
if [ ! -f "venv/.requirements_installed" ]; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install --upgrade pip
    pip install -r requirements.txt
    touch venv/.requirements_installed
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Python dependencies already installed${NC}"
fi

# Initialize database
echo -e "${YELLOW}Initializing database...${NC}"
python init_db.py

# Create necessary directories
mkdir -p uploads logs chroma_data

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo

# Setup Node.js frontend
echo -e "${BLUE}🌐 Setting up Node.js frontend...${NC}"
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

cd ..

# Kill existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
kill_port 8000  # Backend port
kill_port 3000  # Frontend port
echo

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your API keys before using the application${NC}"
fi

# Start services
echo -e "${BLUE}🔥 Starting services...${NC}"
echo

# Start backend
echo -e "${YELLOW}Starting backend server on http://127.0.0.1:8000${NC}"
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${YELLOW}Starting frontend server on http://localhost:3000${NC}"
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Check if services are running
if port_in_use 8000; then
    echo -e "${GREEN}✅ Backend is running on http://127.0.0.1:8000${NC}"
    echo -e "${BLUE}   📚 API Documentation: http://127.0.0.1:8000/docs${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo -e "${YELLOW}Check logs/backend.log for details${NC}"
fi

if port_in_use 3000; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo -e "${YELLOW}Check logs/frontend.log for details${NC}"
fi

echo
echo -e "${GREEN}🎉 Local development environment is ready!${NC}"
echo
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API: ${GREEN}http://127.0.0.1:8000${NC}"
echo -e "   API Docs: ${GREEN}http://127.0.0.1:8000/docs${NC}"
echo
echo -e "${BLUE}📁 Useful commands:${NC}"
echo -e "   View backend logs: ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "   View frontend logs: ${YELLOW}tail -f logs/frontend.log${NC}"
echo -e "   Stop all services: ${YELLOW}./stop-local-dev.sh${NC}"
echo
echo -e "${BLUE}🔧 Development Notes:${NC}"
echo -e "   • All dependencies are installed in project directories"
echo -e "   • Python virtual environment: backend/venv/"
echo -e "   • Node modules: frontend/node_modules/"
echo -e "   • Database: backend/langchain_dify.db"
echo -e "   • Make sure to edit .env file with your API keys"
echo 