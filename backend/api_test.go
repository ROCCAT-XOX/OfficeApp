package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func testAPI(t *testing.T, hour int) (*API, *fakeCP4N, *gin.Engine) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	f := newFakeCP4N(t)
	c := startClient(t, f)
	loc, _ := time.LoadLocation("Europe/Berlin")
	a := &API{cp4n: c, loc: loc, now: func() time.Time { return time.Date(2026, 10, 5, hour, 0, 0, 0, loc) }}
	r := gin.New()
	r.GET("/webhook", a.WebhookGet)
	r.POST("/webhook", a.WebhookPost)
	r.POST("/cmd", a.Command)
	r.POST("/relais/:relayID/:state", a.LegacyRelay)
	return a, f, r
}

func do(r *gin.Engine, method, path, body string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	return w
}

func commandsSent(f *fakeCP4N) []string {
	var out []string
	for _, l := range f.sent() {
		if l != "STATUS" {
			out = append(out, l)
		}
	}
	return out
}

func TestWebhookGetDuringOfficeHours(t *testing.T) {
	_, f, r := testAPI(t, 9)
	if w := do(r, "GET", "/webhook", ""); w.Code != http.StatusOK {
		t.Fatalf("Status %d", w.Code)
	}
	got := strings.Join(commandsSent(f), ",")
	if got != "TUER AUTOMATIK,LICHT DECKE AN" {
		t.Errorf("gesendet: %s", got)
	}
}

func TestWebhookGetAtNightNoLight(t *testing.T) {
	_, f, r := testAPI(t, 22)
	do(r, "GET", "/webhook", "")
	if got := strings.Join(commandsSent(f), ","); got != "TUER AUTOMATIK" {
		t.Errorf("gesendet: %s", got)
	}
}

func TestWebhookPostDoorOnly(t *testing.T) {
	_, f, r := testAPI(t, 9)
	do(r, "POST", "/webhook", `{"alarm":{"name":"Klingel"},"timestamp":1790980000000}`)
	if got := strings.Join(commandsSent(f), ","); got != "TUER AUTOMATIK" {
		t.Errorf("gesendet: %s", got)
	}
}

func TestCommandRejectsUnknown(t *testing.T) {
	_, f, r := testAPI(t, 9)
	if w := do(r, "POST", "/cmd", `{"command":"SR 1 on 400"}`); w.Code != http.StatusBadRequest {
		t.Errorf("Status %d", w.Code)
	}
	if len(commandsSent(f)) != 0 {
		t.Errorf("ungültiger Befehl gesendet: %v", commandsSent(f))
	}
}

func TestLegacyRelayMapping(t *testing.T) {
	_, f, r := testAPI(t, 9)
	do(r, "POST", "/relais/1/on", "")
	if got := strings.Join(commandsSent(f), ","); got != "TUER AUTOMATIK" {
		t.Errorf("gesendet: %s", got)
	}
	if w := do(r, "POST", "/relais/5/on", ""); w.Code != http.StatusBadRequest {
		t.Errorf("Relais 5 sollte abgelehnt werden, Status %d", w.Code)
	}
}
