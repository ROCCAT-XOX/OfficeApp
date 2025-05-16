FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Astro application
RUN npm run build

# Production image
FROM caddy:2-alpine

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/caddy

# Copy Caddyfile with proxy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Expose port 80
EXPOSE 80

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]