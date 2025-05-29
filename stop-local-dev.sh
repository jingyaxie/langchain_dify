#!/bin/bash

# LangChain Dify Local Development Stop Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping LangChain Dify Local Development Environment${NC}"
echo

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    local pid=$(lsof -t -i:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Stopping $service on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ $service stopped${NC}"
    else
        echo -e "${YELLOW}No process found on port $port${NC}"
    fi
}

# Stop services by port
kill_port 8000 "Backend"
kill_port 3000 "Frontend"

# Stop services by PID files
if [ -f "logs/backend.pid" ]; then
    backend_pid=$(cat logs/backend.pid)
    if ps -p $backend_pid > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping backend process (PID: $backend_pid)${NC}"
        kill -9 $backend_pid 2>/dev/null || true
    fi
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    frontend_pid=$(cat logs/frontend.pid)
    if ps -p $frontend_pid > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping frontend process (PID: $frontend_pid)${NC}"
        kill -9 $frontend_pid 2>/dev/null || true
    fi
    rm -f logs/frontend.pid
fi

# Kill any remaining Node.js and Python processes related to our project
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

echo
echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
echo -e "${BLUE}📁 Log files are preserved in logs/ directory${NC}"
echo 