# Build Stage
FROM --platform=linux/amd64 golang:1.24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY *.go ./

# Build the application specifically for linux/amd64
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main .

# Final Stage
FROM --platform=linux/amd64 alpine:3.19

# Install necessary runtime dependencies
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Expose port 8080
EXPOSE 8080

# Command to run the executable
CMD ["./main"]