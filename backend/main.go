package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"log"
	"time"
	_ "time/tzdata" // Bürozeiten in deutscher Zeit, auch im Alpine-Container ohne Zeitzonen
)

func main() {
	cp4n := NewCP4N(CP4NAddress)
	go cp4n.Run()

	berlin, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		log.Fatalf("Zeitzone: %v", err)
	}
	api := &API{cp4n: cp4n, loc: berlin}

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

	// UniFi Protect Webhooks (Klingel Schiebetür)
	router.GET("/webhook", api.WebhookGet)
	router.POST("/webhook", api.WebhookPost)

	// Zustand, Live-Meldungen, Befehle, Szenen, Protokoll – alles über den CP4N
	router.GET("/state", api.GetState)
	router.GET("/events", api.Events)
	router.POST("/cmd", api.Command)
	router.POST("/scene/:name", api.Scene)
	router.GET("/log", api.GetLog)

	// Alte Adressen der ersten Office-App, jetzt auf CP4N-Befehle übersetzt
	router.POST("/relais/:relayID/:state", api.LegacyRelay)
	router.POST("/relais/:relayID/:state/:duration", api.LegacyRelay)
	router.POST("/esera/:eseraID/:state", api.LegacyEsera)
	router.GET("/doorstate", api.GetDoorState)

	// Server starten
	log.Println("🚀 Server startet auf http://0.0.0.0:8080")
	router.Run("0.0.0.0:8080")
}
