import React from "react";

export default function RelayButton({ relayId, label }) {
    const handleClick = async () => {
        // Beispielhafter Fetch-Request
        try {
            const response = await fetch(`http://10.100.102.111:8080/relais/${relayId}/on`, {
                method: "POST",
            });

            if (!response.ok) {
                console.error("Request fehlgeschlagen:", response.statusText);
                return;
            }

            const data = await response.json();
            console.log("Erfolg:", data);
            alert(`Relais ${relayId} wurde eingeschaltet.`);
        } catch (error) {
            console.error("Fehler beim Senden des Requests:", error);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`
        inline-flex items-center justify-center 
        w-36 h-12  /* Hiermit legst du eine einheitliche Größe fest */
        bg-blue-500 hover:bg-blue-700 
        text-white font-bold 
        px-4 py-2 rounded 
        transition-colors duration-200
        shadow-md
      `}
        >
            {label}
        </button>
    );
}
