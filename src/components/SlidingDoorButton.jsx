import React, { useState, useEffect } from "react";

export default function SlidingDoorButton({ relayId, label, icon, apiUrl = "http://10.100.102.111:8080" }) {
    // State to track if this button is currently active
    const [isActive, setIsActive] = useState(false);
    // Track loading state during API calls
    const [loading, setLoading] = useState(false);

    // Mapping of door states to their relay IDs for reference
    const doorStates = {
        1: "Automatic",
        2: "Always Open",
        3: "Closed",
        4: "End of Day"
    };

    // Function to fetch the current door state on component mount
    useEffect(() => {
        const fetchCurrentState = async () => {
            try {
                // This assumes your backend has an endpoint to get the current state
                // You may need to implement this on your Go backend
                const response = await fetch(`${apiUrl}/doorstate`);
                if (response.ok) {
                    const data = await response.json();
                    // Set active state if this button's relay matches the current door state
                    setIsActive(data.activeRelay === relayId);
                }
            } catch (error) {
                console.error("Failed to fetch door state:", error);
            }
        };

        fetchCurrentState();
    }, [relayId, apiUrl]);

    const handleClick = async () => {
        setLoading(true);
        try {
            // Send command to activate this relay
            const response = await fetch(`${apiUrl}/relais/${relayId}/on`, {
                method: "POST",
            });

            if (!response.ok) {
                console.error("Request failed:", response.statusText);
                return;
            }

            const data = await response.json();
            console.log("Success:", data);

            // Update all buttons through a custom event
            window.dispatchEvent(new CustomEvent('doorStateChanged', {
                detail: { activeRelay: relayId }
            }));

            // Set this button as active
            setIsActive(true);
        } catch (error) {
            console.error("Error sending request:", error);
        } finally {
            setLoading(false);
        }
    };

    // Listen for door state changes from other buttons
    useEffect(() => {
        const handleStateChange = (event) => {
            setIsActive(event.detail.activeRelay === relayId);
        };

        window.addEventListener('doorStateChanged', handleStateChange);
        return () => {
            window.removeEventListener('doorStateChanged', handleStateChange);
        };
    }, [relayId]);

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`
                inline-flex items-center justify-center 
                w-40 h-14  
                ${isActive
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-500 hover:bg-blue-700"
            } 
                text-white font-bold 
                px-4 py-3 rounded-lg
                transition-all duration-200
                shadow-md
                ${loading ? "opacity-75 cursor-wait" : ""}
                ${isActive ? "ring-2 ring-offset-2 ring-green-500" : ""}
            `}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {label}
            {isActive && <span className="ml-2 h-2 w-2 rounded-full bg-white animate-pulse"></span>}
        </button>
    );
}