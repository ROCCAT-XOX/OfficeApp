package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// SwitchRelay kümmert sich um das Verarbeiten der Request-Parameter
// und das Versenden des TCP-Kommandos.
func SetRelay(c *gin.Context) {
	relayID := c.Param("relayID") // "1", "2", ...
	state := c.Param("state")     // "on" oder "off"
	duration := c.Param("duration") // optional: Dauer in Millisekunden

	// Default-Wert für die Dauer
	durationMs := "400"

	// Wenn eine benutzerdefinierte Dauer angegeben wurde, verwende diese
	if duration != "" {
		durationMs = duration
	}

	// Optional: Gültigkeitsprüfung
	rID, err := strconv.Atoi(relayID)
	if err != nil || rID < 1 || rID > 8 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Ungültige Relais-ID. Erlaubt sind nur 1..8",
			"relayID": relayID,
		})
		return
	}
	if state != "on" && state != "off" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ungültiger Zustand. Erlaubt sind nur 'on' oder 'off'",
			"state": state,
		})
		return
	}

	// Bei Türsteuerung (Relais 1-4) aktualisiere den Status
	if rID >= 1 && rID <= 4 && state == "on" {
		doorState = rID
		log.Printf("📝 Türstatus aktualisiert auf: %d", rID)
	}

	// Den finalen Befehl zusammenbauen, z.B. "SR 1 on 400" oder "SR 8 on 60000"
	command := fmt.Sprintf("SR %d %s %s", rID, state, durationMs)

	// TCP-Verbindung zu 10.100.102.70:17123 herstellen
	target := "10.100.102.70:17123"
	conn, err := net.Dial("tcp", target)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Fehler beim Verbinden mit %s: %v", target, err),
		})
		return
	}
	defer conn.Close()

	// Befehl senden (+ "\n" als Zeilenumbruch, falls das Gerät das erwartet)
	if _, err := conn.Write([]byte(command + "\n")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Fehler beim Senden des Befehls '%s': %v", command, err),
		})
		return
	}

	// Ergebnis zurückgeben
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Relais %s wurde auf '%s' geschaltet (Dauer: %s ms)", relayID, state, durationMs),
		"status": gin.H{
			"activeRelay": doorState,
		},
	})
}

func Welcome() {
	command := "SR 1 ON 400" // Beispielbefehl für Webhook

	target := "10.100.102.70:17123"
	conn, err := net.Dial("tcp", target)
	if err != nil {
		log.Printf("❌ Fehler beim Verbinden mit %s: %v", target, err)
		return
	}
	defer conn.Close()

	// TCP-Befehl senden
	if _, err := conn.Write([]byte(command + "\n")); err != nil {
		log.Printf("❌ Fehler beim Senden des Befehls '%s': %v", command, err)
		return
	}

	// Aktualisiere den Status auf "Automatic" (1)
	doorState = 1

	log.Println("✅ Webhook-Befehl gesendet:", command)
}