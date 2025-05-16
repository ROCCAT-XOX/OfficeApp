#!/bin/bash

# Create backend directory if it doesn't exist
mkdir -p backend

# Create the corrected go.mod file
cat > backend/go.mod << EOF
module officeapp

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/gorilla/mux v1.8.1
)

require (
	github.com/bytedance/sonic v1.9.1 // indirect
	github.com/chenzhuoyu/base64x v0.0.0-20221115062448-fe3a3abad311 // indirect
	github.com/gabriel-vasile/mimetype v1.4.2 // indirect
	github.com/gin-contrib/sse v0.1.0 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-playground/validator/v10 v10.14.0 // indirect
	github.com/goccy/go-json v0.10.2 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/cpuid/v2 v2.2.4 // indirect
	github.com/leodido/go-urn v1.2.4 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/pelletier/go-toml/v2 v2.0.8 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/ugorji/go/codec v1.2.11 // indirect
	golang.org/x/arch v0.3.0 // indirect
	golang.org/x/crypto v0.9.0 // indirect
	golang.org/x/net v0.10.0 // indirect
	golang.org/x/sys v0.8.0 // indirect
	golang.org/x/text v0.9.0 // indirect
	google.golang.org/protobuf v1.30.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
EOF
echo "✅ Created fixed go.mod file compatible with Go 1.21"

# Copy the source Go files to the backend directory
echo "Copying Go files to backend directory..."
if [ -f "backend/main.go" ]; then
  echo "ℹ️ Main Go files already exist in backend directory"
else
  # Try to copy from parent directory if files are there
  if [ -f "main.go" ]; then
    cp main.go relay.go esera.go backend/ 2>/dev/null || true
    echo "✅ Copied Go files from root directory to backend"
  else
    # Try to copy from any directory that might have the files
    find . -maxdepth 2 -name "main.go" -exec cp {} backend/ \; 2>/dev/null || true
    find . -maxdepth 2 -name "relay.go" -exec cp {} backend/ \; 2>/dev/null || true
    find . -maxdepth 2 -name "esera.go" -exec cp {} backend/ \; 2>/dev/null || true
    echo "✅ Tried to locate and copy Go files to backend directory"
  fi
fi

# Create the improved Dockerfile.backend
cat > backend/Dockerfile.backend << EOF
# Use the official Go image as a parent image
FROM golang:1.21-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy go.mod file
COPY go.mod ./

# Run go mod tidy to download dependencies and create go.sum
RUN go mod tidy

# Copy the source code
COPY *.go ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Use a minimal alpine image for the final stage
FROM alpine:3.18

# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Expose port 8080
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
EOF
echo "✅ Created improved Dockerfile.backend"

# Fix docker-compose.yml file
cat > docker-compose.yml << EOF
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - office-network
    environment:
      - BACKEND_URL=http://backend:8080

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend
    ports:
      - "8080:8080"
    networks:
      - office-network

networks:
  office-network:
    driver: bridge
EOF
echo "✅ Fixed docker-compose.yml file"

echo "Preparation complete! You can now build and start the Docker containers with:"
echo "docker-compose up -d --build"