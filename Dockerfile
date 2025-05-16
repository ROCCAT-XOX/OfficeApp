# Basis-Image: Nutze ein Multiarch-Image für Cross-Builds
FROM node:20-alpine AS builder

# Setze das Arbeitsverzeichnis
WORKDIR /app

# Kopiere nur package.json und package-lock.json für effiziente Caching-Schichten
COPY package.json package-lock.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den gesamten Code und baue das Astro-Projekt
COPY . .
RUN npm run build

# Erstelle das endgültige Image mit einem leichten Webserver (Caddy als Beispiel)
FROM caddy:2.6-alpine

# Setze das Arbeitsverzeichnis für den Webserver
WORKDIR /usr/share/caddy

# Kopiere das gebaute Projekt aus dem vorherigen Schritt
COPY --from=builder /app/dist /usr/share/caddy

# Exponiere den Standardport von Caddy (80)
EXPOSE 80

# Starte Caddy als statischen Webserver
CMD ["caddy", "file-server", "--root", "/usr/share/caddy"]
