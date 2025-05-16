#!/bin/bash

# Build the Docker images and start the containers
docker-compose up -d --build

# Wait for containers to be ready
echo "Waiting for containers to start..."
sleep 10

# Check if the backend is healthy
echo "Checking backend health..."
if curl -s http://localhost:8080/health | grep -q "Backend is running"; then
    echo "✅ Backend is running successfully"
else
    echo "❌ Backend failed to start properly"
fi

# Check if the frontend is accessible
echo "Checking frontend..."
if curl -s -I http://localhost | grep -q "200 OK"; then
    echo "✅ Frontend is running successfully"
else
    echo "❌ Frontend failed to start properly"
fi

echo "==================================================="
echo "🚀 Office Control System is now running!"
echo "- Frontend: http://localhost"
echo "- Backend API: http://localhost:8080"
echo "==================================================="
echo "To stop the services, run: docker-compose down"