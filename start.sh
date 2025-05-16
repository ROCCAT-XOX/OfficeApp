#!/bin/bash

# Stellen Sie sicher, dass das Docker-Netzwerk existiert
docker network create office-network 2>/dev/null || true

# Bauen und starten der Container im Hintergrund
docker-compose up -d --build

echo "Office Control System wird gestartet..."
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:8080"