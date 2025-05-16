import React, { useState } from "react";

export default function LightControlButton({ relayId, label, icon, apiUrl = "http://10.100.102.111:8080" }) {
    const [isOn, setIsOn] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        // Determine the next state: if currently off, send "on", otherwise send "off"
        const newState = isOn ? "off" : "on";
        console.log(`Light ${relayId}: Sending command for ${newState}`);

        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/esera/${relayId}/${newState}`, {
                method: "POST",
            });

            if (!response.ok) {
                console.error("Request failed:", response.statusText);
                return;
            }

            const data = await response.json();
            console.log("Success:", data);

            // Toggle the state
            setIsOn(!isOn);
        } catch (error) {
            console.error("Error sending request:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`
                inline-flex items-center justify-center
                w-40 h-14
                ${isOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-600 hover:bg-gray-700"}
                text-white font-bold
                px-4 py-3 rounded-lg
                transition-all duration-200
                shadow-md
                ${loading ? "opacity-75 cursor-wait" : ""}
                ${isOn ? "ring-2 ring-offset-2 ring-yellow-400" : ""}
            `}
        >
            {icon && <span className="mr-2">{icon}</span>}
            <span>{label}</span>
            {isOn && <span className="ml-2">●</span>}
        </button>
    );
}