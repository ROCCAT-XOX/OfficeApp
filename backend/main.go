package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"time"
)

// Struktur für den Webhook-POST-Request von UniFi Protect
// UniFi Webhook Struktur
type UniFiWebhook struct {
	Alarm struct {
		Name     string `json:"name"`
		Triggers []struct {
			Key    string `json:"key"`
			Device string `json:"device"`
		} `json:"triggers"`
	} `json:"alarm"`
	Timestamp int64 `json:"timestamp"`
}

// Eine einfache globale Variable für den Türstatus
var doorState = 1 // Standardwert: 1 = Automatic

// Webhook-Handler-Funktion
func HandleUniFiWebhook(c *gin.Context) {
	var webhook UniFiWebhook

	// JSON einlesen
	if err := c.ShouldBindJSON(&webhook); err != nil {
		log.Printf("❌ Fehler beim Parsen des Webhook-Requests: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Timestamp formatieren
	eventTime := time.Unix(webhook.Timestamp/1000, 0)

	// Log-Output
	log.Printf("🔔 Webhook erhalten: %s - Zeit: %s", webhook.Alarm.Name, eventTime.Format(time.RFC3339))

	// Welcome-Funktion ausführen (SR 1 ON senden)
	Welcome()

	c.JSON(http.StatusOK, gin.H{"message": "Webhook empfangen und Welcome ausgeführt"})
}

// GET-Handler für /webhook
func GetUniFiWebhook(c *gin.Context) {
	// Die gesamte Anfrage ausgeben
	body, err := c.GetRawData()
	if err != nil {
		log.Printf("❌ Fehler beim Lesen der Anfrage: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Fehler beim Lesen der Anfrage"})
		return
	}

	// Log-Output der gesamten Anfrage
	log.Printf("🔔 Webhook erhalten (GET): %s", string(body))

	// Welcome-Funktion ausführen
	Welcome()
	WelcomeEsera()

	c.JSON(http.StatusOK, gin.H{
		"message": "Webhook empfangen und Welcome ausgeführt (GET)",
		"data":    string(body),
	})
}

// GET-Handler für /doorstate
func GetDoorState(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"activeRelay": doorState,
		"lastUpdated": time.Now().Unix(),
	})
}

func main() {
	// Gin-Engine initialisieren
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Route für UniFi Protect Webhooks (GET)
	router.GET("/webhook", GetUniFiWebhook)

	// Route für UniFi Protect Webhooks
	router.POST("/webhook", HandleUniFiWebhook)

	// Route für Relaissteuerung
	router.POST("/relais/:relayID/:state", SetRelay)

	// Route für ESERA-Relaissteuerung
	router.POST("/esera/:eseraID/:state", EseraSetRelay)

	// Route für den Türzustand
	router.GET("/doorstate", GetDoorState)

	// Server starten
	log.Println("🚀 Server startet auf http://0.0.0.0:8080")
	router.Run("0.0.0.0:8080")
}
