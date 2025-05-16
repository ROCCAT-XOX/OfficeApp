# Verwenden eines neueren Go-Images als Basis-Image
FROM golang:1.24-alpine AS builder

# Arbeitsverzeichnis festlegen
WORKDIR /app

# go.mod und go.sum-Dateien kopieren
COPY go.mod go.sum ./

# Abhängigkeiten herunterladen
RUN go mod download

# Quellcode kopieren
COPY *.go ./

# Anwendung bauen
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Ein minimales Alpine-Image für die finale Stage verwenden
FROM alpine:3.19

# Notwendige Laufzeitabhängigkeiten installieren
RUN apk --no-cache add ca-certificates

# Arbeitsverzeichnis festlegen
WORKDIR /app

# Binary aus der Builder-Stage kopieren
COPY --from=builder /app/main .

# Port 8080 freigeben
EXPOSE 8080

# Befehl zum Ausführen der ausführbaren Datei
CMD ["./main"]