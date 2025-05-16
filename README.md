# Office Control System - Docker Setup

This repository contains the Office Control System with Docker configuration for easy deployment.

## Project Structure

```
root/
├── src/                  # Frontend Astro source code
├── backend/              # Go backend code
│   ├── main.go           # Main backend application
│   ├── go.mod            # Go module definition
│   └── Dockerfile.backend # Backend Docker configuration
├── Dockerfile.frontend   # Frontend Docker configuration
├── Caddyfile             # Caddy server configuration
├── docker-compose.yml    # Docker Compose configuration
└── start.sh              # Startup script
```

## Prerequisites

- Docker & Docker Compose
- Make sure ports 80 and 8080 are available on your machine

## Getting Started

1. Clone this repository
2. Make sure the startup script is executable:
   ```bash
   chmod +x start.sh
   ```
3. Run the startup script:
   ```bash
   ./start.sh
   ```

This will build and start the Docker containers for both the frontend and backend.

## Accessing the Application

- Frontend: http://localhost
- Backend API: http://localhost:8080

## API Endpoints

The backend exposes the following API endpoints:

- `POST /relais/{id}/{state}` - Control door relays (IDs 1-8, state "on" or "off")
- `POST /esera/{id}/{state}` - Control lighting relays (IDs 1-8, state "on" or "off")
- `GET /doorstate` - Get current door state information
- `GET /health` - Check backend health status

## Manual Docker Commands

If you prefer to manage the containers manually:

- Build and start containers:
  ```bash
  docker-compose up -d --build
  ```

- Stop containers:
  ```bash
  docker-compose down
  ```

- View logs:
  ```bash
  docker-compose logs -f
  ```

## Modifying API URLs

If you need to change the API URL in the frontend code, update the following files:

- `src/components/LightControlButton.jsx`
- `src/components/SlidingDoorButton.jsx`
- `src/pages/index.astro`
- `src/pages/light.astro`
- `src/pages/rollershutter.astro`

The API URL should be set to `/api` instead of absolute URLs for the Docker setup to work correctly.

## Known Issues

- This is a simplified backend implementation. In a production environment, you would connect to actual hardware.
- The frontend and backend are configured to work with HTTP. For production, consider enabling HTTPS.