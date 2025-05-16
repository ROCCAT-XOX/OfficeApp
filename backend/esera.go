package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ESERA device address configuration
const (
	// Use a consistent IP address for the ESERA device
	EseraAddress = "10.100.102.160:5000" // Adjust this to match your actual ESERA device address
)

// EseraSetRelay verarbeitet POST-Anfragen an /esera/:eseraID/:state.
// Dabei wird ein TCP-Befehl an das ESERA-Gerät gesendet.
func EseraSetRelay(c *gin.Context) {
	eseraID := c.Param("eseraID") // "1", "2", ...
	state := c.Param("state")     // "on" oder "off"

	// Validierung der ESERA-ID
	rID, err := strconv.Atoi(eseraID)
	if err != nil || rID < 1 || rID > 8 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Ungültige Relais-ID. Erlaubt sind nur 1..8",
			"relayID": eseraID,
		})
		return
	}

	// Validierung des Zustands
	if state != "on" && state != "off" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ungültiger Zustand. Erlaubt sind nur 'on' oder 'off'",
			"state": state,
		})
		return
	}

	// Zustand in den entsprechenden Wert umwandeln: "on" → "1", "off" → "0"
	var value string
	if state == "on" {
		value = "1"
	} else {
		value = "0"
	}

	// Befehl zusammenbauen mit korrektem Delimiter \x0d\x0a (entspricht \r\n)
	command := fmt.Sprintf("SET,SYS,OUT,%d,%s", rID, value)

	// TCP-Verbindung herstellen
	target := "10.100.102.160:5000" // ESERA-Gerät Adresse
	conn, err := net.Dial("tcp", target)
	if err != nil {
		log.Printf("❌ Fehler beim Verbinden mit %s: %v", target, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Fehler beim Verbinden mit %s: %v", target, err),
		})
		return
	}
	defer conn.Close()

	// Timeout setzen (3 Sekunden für Senden und Lesen)
	conn.SetDeadline(time.Now().Add(3 * time.Second))

	// Befehl mit dem korrekten Delimiter senden
	commandWithDelimiter := command + "\r\n" // entspricht \x0d\x0a
	log.Printf("Sende Befehl: %s", command)

	if _, err := conn.Write([]byte(commandWithDelimiter)); err != nil {
		log.Printf("❌ Fehler beim Senden des Befehls '%s': %v", command, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Fehler beim Senden des Befehls '%s': %v", command, err),
		})
		return
	}

	// Antwort vom Gerät einlesen
	buf := make([]byte, 1024)
	n, err := conn.Read(buf)
	if err != nil {
		log.Printf("❌ Fehler beim Empfangen der Antwort: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Fehler beim Empfangen der Antwort: %v", err),
		})
		return
	}
	response := string(buf[:n])
	log.Printf("✅ ESERA Relay %d wurde auf '%s' gesetzt. Antwort: %s", rID, state, response)

	// Erfolgsmeldung zurückgeben
	c.JSON(http.StatusOK, gin.H{
		"message":  fmt.Sprintf("Esera Relais %d wurde auf '%s' geschaltet", rID, state),
		"response": response,
		"success":  true,
	})
}

func WelcomeEsera() {
	now := time.Now()
	hour := now.Hour()

	if hour >= 7 && hour < 19 { // Erweiterte Zeitspanne für Bürozeiten
		// Befehl zum Einschalten von ESERA-Relais 7 (Hauptbeleuchtung)
		command := "SET,SYS,OUT,7,1\r\n"

		conn, err := net.Dial("tcp", EseraAddress)
		if err != nil {
			log.Printf("❌ Fehler beim Verbinden mit %s: %v", EseraAddress, err)
			return
		}
		defer conn.Close()

		// Timeout für Senden und Empfangen setzen (3 Sekunden)
		conn.SetDeadline(time.Now().Add(3 * time.Second))

		if _, err := conn.Write([]byte(command)); err != nil {
			log.Printf("❌ Fehler beim Senden des Befehls '%s': %v", command, err)
			return
		}

		buf := make([]byte, 1024)
		n, err := conn.Read(buf)
		if err != nil {
			log.Printf("❌ Fehler beim Empfangen der Antwort: %v", err)
			return
		}
		response := string(buf[:n])
		log.Printf("✅ ESERA Relay 7 wurde während der Bürozeiten eingeschaltet. Antwort: %s", response)
	} else {
		log.Printf("⌚ WelcomeEsera() wurde nicht ausgeführt, da die aktuelle Stunde (%d) außerhalb der Bürozeiten liegt.", hour)
	}
}
