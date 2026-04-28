#!/bin/bash

echo "========================================"
echo "  KYBERS.OS - Quick Start"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo "[1/3] Installing dependencies..."
    cd backend
    npm install
    cd ..
    echo ""
else
    echo "[1/3] Dependencies already installed"
    echo ""
fi

# Start server in background
echo "[2/3] Starting server..."
cd backend
npm start &
SERVER_PID=$!
cd ..
echo ""

# Wait for server to start
sleep 3

# Open browser
echo "[3/3] Opening browser..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5000
elif command -v open > /dev/null; then
    open http://localhost:5000
fi
echo ""

echo "========================================"
echo "  Server running on http://localhost:5000"
echo "  Server PID: $SERVER_PID"
echo "  Press Ctrl+C to stop"
echo "========================================"

# Wait for Ctrl+C
trap "kill $SERVER_PID; exit" INT
wait $SERVER_PID
