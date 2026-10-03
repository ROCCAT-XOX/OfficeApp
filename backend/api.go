package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type API struct {
	cp4n *CP4N
	loc  *time.Location
	now  func() time.Time // für Tests austauschbar
}

func (a *API) clock() time.Time {
	if a.now != nil {
		return a.now().In(a.loc)
	}
	return time.Now().In(a.loc)
}

// Struktur für den Webhook-POST-Request von UniFi Protect
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

// welcome: Klingel hat jemanden erkannt → Tür auf Automatik, optional zu Bürozeiten Deckenlicht an.
func (a *API) welcome(withLight bool) []string {
	var results []string
	run := func(cmd string) {
		reply, err := a.cp4n.Send(cmd, "Klingel")
		if err != nil {
			log.Printf("❌ Klingel → %s: %v", cmd, err)
			results = append(results, fmt.Sprintf("%s: %v", cmd, err))
			return
		}
		log.Printf("✅ Klingel → %s: %s", cmd, reply)
		results = append(results, reply)
	}

	run("TUER AUTOMATIK")
	if withLight {
		if h := a.clock().Hour(); h >= 7 && h < 19 {
			run("LICHT DECKE AN")
		} else {
			log.Printf("⌚ Deckenlicht nicht eingeschaltet: %d Uhr liegt außerhalb der Bürozeiten", h)
		}
	}
	return results
}

func (a *API) WebhookPost(c *gin.Context) {
	var webhook UniFiWebhook
	if err := c.ShouldBindJSON(&webhook); err != nil {
		log.Printf("❌ Fehler beim Parsen des Webhook-Requests: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	eventTime := time.Unix(webhook.Timestamp/1000, 0)
	log.Printf("🔔 Webhook erhalten: %s - Zeit: %s", webhook.Alarm.Name, eventTime.Format(time.RFC3339))

	c.JSON(http.StatusOK, gin.H{"message": "Webhook empfangen", "results": a.welcome(false)})
}

func (a *API) WebhookGet(c *gin.Context) {
	body, _ := io.ReadAll(c.Request.Body)
	log.Printf("🔔 Webhook erhalten (GET): %s", string(body))

	c.JSON(http.StatusOK, gin.H{"message": "Webhook empfangen (GET)", "results": a.welcome(true)})
}

func (a *API) GetState(c *gin.Context) {
	c.JSON(http.StatusOK, a.cp4n.State())
}

// Events schickt den Zustand als Server-Sent Events: sofort und bei jeder Änderung.
func (a *API) Events(c *gin.Context) {
	ch := a.cp4n.Subscribe()
	defer a.cp4n.Unsubscribe(ch)

	c.Header("Cache-Control", "no-cache")
	c.Header("X-Accel-Buffering", "no")
	c.SSEvent("message", a.cp4n.State())
	c.Writer.Flush()

	keepAlive := time.NewTicker(25 * time.Second)
	defer keepAlive.Stop()
	for {
		select {
		case <-c.Request.Context().Done():
			return
		case s := <-ch:
			c.SSEvent("message", s)
			c.Writer.Flush()
		case <-keepAlive.C:
			c.Writer.Write([]byte(": ping\n\n"))
			c.Writer.Flush()
		}
	}
}

func (a *API) Command(c *gin.Context) {
	var req struct {
		Command string `json:"command"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON mit \"command\" erwartet"})
		return
	}
	a.respond(c, req.Command, "Web-App")
}

func (a *API) respond(c *gin.Context, cmd, source string) {
	reply, err := a.cp4n.Send(cmd, source)
	if err != nil {
		status := http.StatusBadGateway
		if !allowedCommand.MatchString(cmd) {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error(), "reply": reply})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "reply": reply})
}

var scenes = map[string][]string{
	"start": {"TUER AUTOMATIK", "LICHT DECKE AN"},
	"end":   {"TUER FEIERABEND", "LICHT ALLE AUS"},
}

func (a *API) Scene(c *gin.Context) {
	cmds, ok := scenes[c.Param("name")]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Szene unbekannt (start|end)"})
		return
	}
	var replies []string
	for _, cmd := range cmds {
		reply, err := a.cp4n.Send(cmd, "Web-App")
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("%s: %v", cmd, err), "done": replies})
			return
		}
		replies = append(replies, reply)
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "replies": replies})
}

func (a *API) GetLog(c *gin.Context) {
	c.JSON(http.StatusOK, a.cp4n.Log())
}

// Alte Relais-Nummern (dS378) → CP4N-Befehle. 1–4 Türmodi, 7 Rollladen zu, 8 Rollladen auf.
var legacyDoor = map[string]string{"1": "AUTOMATIK", "2": "OFFEN", "3": "FEIERABEND", "4": "GESCHLOSSEN"}

func (a *API) LegacyRelay(c *gin.Context) {
	id, state := c.Param("relayID"), c.Param("state")
	var cmd string
	switch {
	case legacyDoor[id] != "" && state == "on":
		cmd = "TUER " + legacyDoor[id]
	case id == "7" && state == "on":
		cmd = "ROLLLADEN ZU"
	case id == "8" && state == "on":
		cmd = "ROLLLADEN AUF"
	case (id == "7" || id == "8") && state == "off":
		cmd = "ROLLLADEN STOPP"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Relais/Zustand wird nicht mehr unterstützt", "relayID": id, "state": state})
		return
	}
	a.respond(c, cmd, "Web-App")
}

func (a *API) LegacyEsera(c *gin.Context) {
	id, state := c.Param("eseraID"), c.Param("state")
	word := map[string]string{"on": "AN", "off": "AUS"}[state]
	if word == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ungültiger Zustand. Erlaubt sind nur 'on' oder 'off'"})
		return
	}
	a.respond(c, fmt.Sprintf("LICHT %s %s", id, word), "Web-App")
}

// GetDoorState liefert den Türmodus wie früher als Relaisnummer.
func (a *API) GetDoorState(c *gin.Context) {
	s := a.cp4n.State()
	relay := 0
	for k, v := range legacyDoor {
		if v == s.Door {
			fmt.Sscan(k, &relay)
		}
	}
	c.JSON(http.StatusOK, gin.H{"activeRelay": relay, "door": s.Door, "lastUpdated": s.Updated.Unix()})
}
