package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

// Response is the standard API response structure
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// RelayState represents the state of each relay
type RelayState struct {
	ID     int       `json:"id"`
	State  string    `json:"state"` // "on" or "off"
	LastOn time.Time `json:"lastOn,omitempty"`
}

// DoorState represents the current door state
type DoorState struct {
	ActiveRelay int    `json:"activeRelay"`
	Status      string `json:"status"`
}

var (
	// Store the state of relays (1-8)
	relays = make(map[int]*RelayState)

	// Door state tracker
	doorState = DoorState{
		ActiveRelay: 1, // Default to automatic
		Status:      "Automatic",
	}
)

func init() {
	// Initialize relays
	for i := 1; i <= 8; i++ {
		relays[i] = &RelayState{
			ID:    i,
			State: "off",
		}
	}
}

func main() {
	router := mux.NewRouter()

	// CORS middleware
	router.Use(corsMiddleware)

	// Define routes
	router.HandleFunc("/relais/{id}/{state}", handleRelayControl).Methods("POST")
	router.HandleFunc("/esera/{id}/{state}", handleEseraControl).Methods("POST")
	router.HandleFunc("/doorstate", getDoorState).Methods("GET")

	// Health check endpoint
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		sendJSONResponse(w, Response{
			Success: true,
			Message: "Backend is running",
		})
	}).Methods("GET")

	// Start server
	fmt.Println("Starting server on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", router))
}

// corsMiddleware handles CORS for our API
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the next handler
		next.ServeHTTP(w, r)
	})
}

// handleRelayControl manages relay state (door control)
func handleRelayControl(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	// Extract relay ID and state from URL
	relayIDStr := vars["id"]
	state := vars["state"]

	relayID, err := strconv.Atoi(relayIDStr)
	if err != nil || relayID < 1 || relayID > 8 {
		sendErrorResponse(w, "Invalid relay ID", http.StatusBadRequest)
		return
	}

	if state != "on" && state != "off" {
		sendErrorResponse(w, "Invalid state. Use 'on' or 'off'", http.StatusBadRequest)
		return
	}

	// Update relay state
	relays[relayID].State = state

	if state == "on" {
		relays[relayID].LastOn = time.Now()

		// If this is a door control relay (1-4), update door state
		if relayID >= 1 && relayID <= 4 {
			doorState.ActiveRelay = relayID

			// Map relay ID to door state
			switch relayID {
			case 1:
				doorState.Status = "Automatic"
			case 2:
				doorState.Status = "Always Open"
			case 3:
				doorState.Status = "Closed"
			case 4:
				doorState.Status = "End of Day"
			}
		}
	}

	log.Printf("Relay %d changed to %s", relayID, state)

	// Return success response
	sendJSONResponse(w, Response{
		Success: true,
		Message: fmt.Sprintf("Relay %d turned %s", relayID, state),
		Data: map[string]interface{}{
			"relay": relayID,
			"state": state,
		},
	})
}

// handleEseraControl manages ESERA relays (lights)
func handleEseraControl(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	// Extract ID and state from URL
	idStr := vars["id"]
	state := vars["state"]

	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 || id > 8 {
		sendErrorResponse(w, "Invalid ESERA ID", http.StatusBadRequest)
		return
	}

	if state != "on" && state != "off" {
		sendErrorResponse(w, "Invalid state. Use 'on' or 'off'", http.StatusBadRequest)
		return
	}

	// This is a simplified example - in reality, you would likely send commands
	// to actual ESERA hardware here

	// Update our internal state tracking
	relays[id].State = state
	if state == "on" {
		relays[id].LastOn = time.Now()
	}

	log.Printf("ESERA light %d changed to %s", id, state)

	// Return success response
	sendJSONResponse(w, Response{
		Success: true,
		Message: fmt.Sprintf("Light %d turned %s", id, state),
		Data: map[string]interface{}{
			"id":    id,
			"state": state,
		},
	})
}

// getDoorState returns the current door state
func getDoorState(w http.ResponseWriter, r *http.Request) {
	sendJSONResponse(w, Response{
		Success: true,
		Message: "Current door state",
		Data:    doorState,
	})
}

// sendJSONResponse sends a JSON response to the client
func sendJSONResponse(w http.ResponseWriter, resp Response) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// sendErrorResponse sends an error response to the client
func sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(Response{
		Success: false,
		Message: message,
	})
}