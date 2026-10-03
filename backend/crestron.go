package main

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"net"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// CP4N-Adresse: Programm „BueroSteuerung“, TCP 9000, Textprotokoll (network-docs docs/61).
const CP4NAddress = "10.100.104.2:9000"

// Nur diese Befehle dürfen an den CP4N (Liste aus HILFE). Alles andere wird abgelehnt,
// damit über die API nichts Unvorhergesehenes geschaltet werden kann.
var allowedCommand = regexp.MustCompile(`^(` +
	`LICHT (TEAMRAUM|LORABELLA|BESPRECHUNG|ARBEITSPLATZ|EINGANG|DECKE|BLAU|[1-8]) (AN|AUS|UM)` +
	`|LICHT ALLE AUS` +
	`|DIMMER (100|[1-9]?[0-9]|MIN|MAX)` +
	`|TUER (AUTOMATIK|OFFEN|FEIERABEND|GESCHLOSSEN)` +
	`|ROLLLADEN (AUF|ZU|STOPP)` +
	`|STATUS|PING)$`)

// State ist der vom CP4N gemeldete Zustand. Die App merkt sich selbst nichts.
type State struct {
	Connected bool              `json:"connected"`
	Lights    map[string]bool   `json:"lights"`
	Dimmer    int               `json:"dimmer"`
	Door      string            `json:"door"`
	Shutter   string            `json:"shutter"`
	Devices   map[string]string `json:"devices"`
	Updated   time.Time         `json:"updated"`
}

// Event ist ein Protokolleintrag (Befehl von App/Klingel oder gemeldete Änderung).
type Event struct {
	Time   time.Time `json:"time"`
	Source string    `json:"source"`
	Text   string    `json:"text"`
}

const logSize = 100

type CP4N struct {
	addr  string
	retry time.Duration

	mu     sync.Mutex
	conn   net.Conn
	state  State
	events []Event
	subs   map[chan State]struct{}
	closed bool

	cmdMu   sync.Mutex  // ein Befehl nach dem anderen
	replies chan string // Antworten (alles außer STATUS-Zeilen)
}

func NewCP4N(addr string) *CP4N {
	return &CP4N{
		addr:    addr,
		retry:   5 * time.Second,
		state:   State{Lights: map[string]bool{}, Devices: map[string]string{}, Dimmer: -1},
		subs:    map[chan State]struct{}{},
		replies: make(chan string, 16),
	}
}

// Run hält die Verbindung offen und baut sie nach Abbruch neu auf.
func (c *CP4N) Run() {
	for {
		c.mu.Lock()
		if c.closed {
			c.mu.Unlock()
			return
		}
		c.mu.Unlock()

		conn, err := net.DialTimeout("tcp", c.addr, 5*time.Second)
		if err != nil {
			log.Printf("❌ CP4N %s nicht erreichbar: %v", c.addr, err)
			time.Sleep(c.retry)
			continue
		}
		log.Printf("✅ Verbunden mit CP4N %s", c.addr)

		c.mu.Lock()
		c.conn = conn
		c.state.Connected = true
		c.mu.Unlock()
		c.broadcast()

		if _, err := conn.Write([]byte("STATUS\n")); err != nil {
			log.Printf("❌ STATUS an CP4N fehlgeschlagen: %v", err)
		}

		sc := bufio.NewScanner(conn)
		for sc.Scan() {
			c.handleLine(strings.TrimSpace(sc.Text()))
		}
		log.Printf("⚠️ Verbindung zum CP4N getrennt: %v", sc.Err())

		c.mu.Lock()
		conn.Close()
		c.conn = nil
		c.state.Connected = false
		c.mu.Unlock()
		c.broadcast()
		time.Sleep(c.retry)
	}
}

func (c *CP4N) Close() {
	c.mu.Lock()
	c.closed = true
	if c.conn != nil {
		c.conn.Close()
	}
	c.mu.Unlock()
}

func (c *CP4N) handleLine(line string) {
	switch {
	case line == "" || line == "ENDE" || strings.HasPrefix(line, "HILFE "):
		return
	case strings.HasPrefix(line, "STATUS "):
		if c.applyStatus(strings.TrimPrefix(line, "STATUS ")) {
			c.broadcast()
		}
	default:
		select {
		case c.replies <- line:
		default: // niemand wartet: alte Antwort verwerfen
		}
	}
}

// applyStatus übernimmt eine Zustandsmeldung; true bei Änderung.
// Änderungen gegenüber einem schon bekannten Wert kommen ins Protokoll.
func (c *CP4N) applyStatus(s string) bool {
	f := strings.Fields(s)
	if len(f) < 2 {
		return false
	}
	c.mu.Lock()
	defer c.mu.Unlock()

	changed, known := false, false
	switch f[0] {
	case "LICHT":
		if len(f) < 3 {
			return false
		}
		on := f[2] == "AN"
		old, ok := c.state.Lights[f[1]]
		known, changed = ok, !ok || old != on
		c.state.Lights[f[1]] = on
	case "DIMMER":
		v, err := strconv.Atoi(f[1])
		if err != nil {
			return false
		}
		known, changed = c.state.Dimmer >= 0, c.state.Dimmer != v
		c.state.Dimmer = v
	case "TUER":
		known, changed = c.state.Door != "", c.state.Door != f[1]
		c.state.Door = f[1]
	case "ROLLLADEN":
		v := strings.Join(f[1:], " ")
		known, changed = c.state.Shutter != "", c.state.Shutter != v
		c.state.Shutter = v
	case "GERAET":
		if len(f) < 3 {
			return false
		}
		v := strings.Join(f[2:], " ")
		old, ok := c.state.Devices[f[1]]
		known, changed = ok, !ok || old != v
		c.state.Devices[f[1]] = v
	default:
		return false
	}
	if changed {
		c.state.Updated = time.Now()
		if known {
			c.addEventLocked("CP4N", s)
		}
	}
	return changed
}

// Send schickt einen erlaubten Befehl und wartet auf die Antwort (OK …).
func (c *CP4N) Send(cmd, source string) (string, error) {
	cmd = strings.TrimSpace(cmd)
	if !allowedCommand.MatchString(cmd) {
		return "", fmt.Errorf("Befehl nicht erlaubt: %q", cmd)
	}

	c.cmdMu.Lock()
	defer c.cmdMu.Unlock()

	c.mu.Lock()
	conn := c.conn
	c.mu.Unlock()
	if conn == nil {
		return "", errors.New("keine Verbindung zum CP4N")
	}

	for len(c.replies) > 0 { // liegengebliebene Antworten verwerfen
		<-c.replies
	}
	conn.SetWriteDeadline(time.Now().Add(3 * time.Second))
	if _, err := conn.Write([]byte(cmd + "\n")); err != nil {
		return "", fmt.Errorf("Senden an CP4N fehlgeschlagen: %w", err)
	}

	select {
	case reply := <-c.replies:
		if cmd != "STATUS" && cmd != "PING" {
			c.mu.Lock()
			c.addEventLocked(source, cmd)
			c.mu.Unlock()
		}
		if strings.HasPrefix(reply, "OK") || reply == "PONG" {
			return reply, nil
		}
		return reply, fmt.Errorf("CP4N meldet: %s", reply)
	case <-time.After(3 * time.Second):
		return "", errors.New("keine Antwort vom CP4N")
	}
}

func (c *CP4N) addEventLocked(source, text string) {
	c.events = append(c.events, Event{Time: time.Now(), Source: source, Text: text})
	if len(c.events) > logSize {
		c.events = c.events[len(c.events)-logSize:]
	}
}

// State liefert eine Kopie des Zustands.
func (c *CP4N) State() State {
	c.mu.Lock()
	defer c.mu.Unlock()
	s := c.state
	s.Lights = make(map[string]bool, len(c.state.Lights))
	for k, v := range c.state.Lights {
		s.Lights[k] = v
	}
	s.Devices = make(map[string]string, len(c.state.Devices))
	for k, v := range c.state.Devices {
		s.Devices[k] = v
	}
	return s
}

// Log liefert die Protokolleinträge, neueste zuerst.
func (c *CP4N) Log() []Event {
	c.mu.Lock()
	defer c.mu.Unlock()
	out := make([]Event, len(c.events))
	for i, e := range c.events {
		out[len(c.events)-1-i] = e
	}
	return out
}

func (c *CP4N) Subscribe() chan State {
	ch := make(chan State, 1)
	c.mu.Lock()
	c.subs[ch] = struct{}{}
	c.mu.Unlock()
	return ch
}

func (c *CP4N) Unsubscribe(ch chan State) {
	c.mu.Lock()
	delete(c.subs, ch)
	c.mu.Unlock()
}

// broadcast schickt den aktuellen Zustand an alle Abonnenten (nur der neueste zählt).
func (c *CP4N) broadcast() {
	s := c.State()
	c.mu.Lock()
	defer c.mu.Unlock()
	for ch := range c.subs {
		select {
		case <-ch:
		default:
		}
		ch <- s
	}
}
