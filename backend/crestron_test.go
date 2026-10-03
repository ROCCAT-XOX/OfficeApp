package main

import (
	"bufio"
	"net"
	"strings"
	"sync"
	"testing"
	"time"
)

// fakeCP4N bildet die TCP-9000-Schnittstelle aus docs/61 nach.
type fakeCP4N struct {
	ln       net.Listener
	mu       sync.Mutex
	received []string
	conns    []net.Conn
}

func newFakeCP4N(t *testing.T) *fakeCP4N {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	f := &fakeCP4N{ln: ln}
	go f.serve()
	t.Cleanup(func() { ln.Close() })
	return f
}

func (f *fakeCP4N) addr() string { return f.ln.Addr().String() }

func (f *fakeCP4N) serve() {
	for {
		conn, err := f.ln.Accept()
		if err != nil {
			return
		}
		f.mu.Lock()
		f.conns = append(f.conns, conn)
		f.mu.Unlock()
		go f.handle(conn)
	}
}

func (f *fakeCP4N) handle(conn net.Conn) {
	sc := bufio.NewScanner(conn)
	for sc.Scan() {
		line := sc.Text()
		f.mu.Lock()
		f.received = append(f.received, line)
		f.mu.Unlock()
		switch {
		case line == "STATUS":
			conn.Write([]byte("STATUS LICHT DECKE AUS\nSTATUS LICHT TEAMRAUM AN\nSTATUS DIMMER 50\nSTATUS TUER FEIERABEND\nSTATUS ROLLLADEN STEHT\nSTATUS GERAET ESERA OK\nSTATUS GERAET DS378 OK\nENDE\n"))
		case line == "PING":
			conn.Write([]byte("PONG\n"))
		case line == "TUER AUTOMATIK":
			// Zustandsmeldung kommt vor der Antwort – der Client muss beides auseinanderhalten.
			conn.Write([]byte("STATUS TUER AUTOMATIK\nOK TUER AUTOMATIK\n"))
		case line == "LICHT DECKE AN":
			conn.Write([]byte("OK LICHT DECKE AN\nSTATUS LICHT DECKE AN\n"))
		default:
			conn.Write([]byte("FEHLER unbekannt\n"))
		}
	}
}

func (f *fakeCP4N) sent() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]string(nil), f.received...)
}

// push schickt eine Zustandsmeldung an alle Verbindungen (wie bei Änderung am TSW).
func (f *fakeCP4N) push(line string) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, c := range f.conns {
		c.Write([]byte(line + "\n"))
	}
}

func waitFor(t *testing.T, what string, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("Zeitüberschreitung: %s", what)
}

func startClient(t *testing.T, f *fakeCP4N) *CP4N {
	t.Helper()
	c := NewCP4N(f.addr())
	c.retry = 50 * time.Millisecond
	go c.Run()
	t.Cleanup(c.Close)
	waitFor(t, "Zustand nach Verbindungsaufbau", func() bool {
		s := c.State()
		return s.Connected && s.Door == "FEIERABEND"
	})
	return c
}

func TestStateAfterConnect(t *testing.T) {
	f := newFakeCP4N(t)
	c := startClient(t, f)

	s := c.State()
	if !s.Lights["TEAMRAUM"] || s.Lights["DECKE"] {
		t.Errorf("Licht falsch übernommen: %v", s.Lights)
	}
	if s.Dimmer != 50 || s.Shutter != "STEHT" {
		t.Errorf("Dimmer/Rollladen falsch: %d %q", s.Dimmer, s.Shutter)
	}
	if s.Devices["ESERA"] != "OK" || s.Devices["DS378"] != "OK" {
		t.Errorf("Geräte falsch: %v", s.Devices)
	}
}

func TestSendReturnsReplyNotStatusLine(t *testing.T) {
	f := newFakeCP4N(t)
	c := startClient(t, f)

	reply, err := c.Send("TUER AUTOMATIK", "Web-App")
	if err != nil {
		t.Fatal(err)
	}
	if reply != "OK TUER AUTOMATIK" {
		t.Errorf("Antwort = %q", reply)
	}
	waitFor(t, "Türzustand", func() bool { return c.State().Door == "AUTOMATIK" })
}

func TestSendRejectsUnknownCommand(t *testing.T) {
	f := newFakeCP4N(t)
	c := startClient(t, f)

	for _, cmd := range []string{"", "LICHT KUECHE AN", "DIMMER 101", "SR 1 on 400", "TUER AUTOMATIK\nROLLLADEN AUF"} {
		if _, err := c.Send(cmd, "Web-App"); err == nil {
			t.Errorf("Befehl %q hätte abgelehnt werden müssen", cmd)
		}
	}
	for _, line := range f.sent() {
		if line != "STATUS" {
			t.Errorf("ungültiger Befehl wurde gesendet: %q", line)
		}
	}
}

func TestSendErrorReply(t *testing.T) {
	f := newFakeCP4N(t)
	c := startClient(t, f)

	if _, err := c.Send("ROLLLADEN AUF", "Web-App"); err == nil || !strings.Contains(err.Error(), "FEHLER") {
		t.Errorf("Fehlerantwort nicht erkannt: %v", err)
	}
}

func TestPushedStatusUpdatesStateAndLog(t *testing.T) {
	f := newFakeCP4N(t)
	c := startClient(t, f)
	updates := c.Subscribe()
	defer c.Unsubscribe(updates)

	f.push("STATUS LICHT TEAMRAUM AUS")
	waitFor(t, "Licht Teamraum aus", func() bool { return !c.State().Lights["TEAMRAUM"] })

	select {
	case <-updates:
	case <-time.After(time.Second):
		t.Fatal("keine Aktualisierung an Abonnenten")
	}

	found := false
	for _, e := range c.Log() {
		if e.Text == "LICHT TEAMRAUM AUS" {
			found = true
		}
	}
	if !found {
		t.Errorf("Änderung fehlt im Protokoll: %+v", c.Log())
	}
}

func TestReconnectAfterDrop(t *testing.T) {
	f := newFakeCP4N(t)
	c := startClient(t, f)

	f.mu.Lock()
	for _, conn := range f.conns {
		conn.Close()
	}
	f.mu.Unlock()

	waitFor(t, "neue Verbindung", func() bool {
		f.mu.Lock()
		n := len(f.conns)
		f.mu.Unlock()
		return n >= 2 && c.State().Connected
	})
}

func TestSendWhileDisconnected(t *testing.T) {
	c := NewCP4N("127.0.0.1:1")
	if _, err := c.Send("PING", "Web-App"); err == nil {
		t.Error("Senden ohne Verbindung muss fehlschlagen")
	}
}
