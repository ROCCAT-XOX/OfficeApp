import { useCallback, useEffect, useState } from "react";

// Live-Zustand vom CP4N über das Backend (/api → Caddy → Backend :8080).
// Die Oberfläche zeigt nur, was der CP4N meldet – sie merkt sich selbst keinen Zustand.
export function useOffice() {
    const [state, setState] = useState(null);
    const [online, setOnline] = useState(true);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const es = new EventSource("/api/events");
        es.onmessage = (e) => {
            setState(JSON.parse(e.data));
            setOnline(true);
        };
        es.onerror = () => setOnline(false); // EventSource verbindet sich selbst neu
        return () => es.close();
    }, []);

    const post = useCallback(async (path, body, key) => {
        setBusy(key);
        setError(null);
        try {
            const res = await fetch(`/api${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `Fehler ${res.status}`);
            return data;
        } catch (e) {
            setError(e.message);
            return null;
        } finally {
            setBusy(null);
        }
    }, []);

    const send = useCallback((command) => post("/cmd", { command }, command), [post]);
    const scene = useCallback((name) => post(`/scene/${name}`, null, `scene:${name}`), [post]);

    return { state, online, busy, error, send, scene };
}

export function useLog(state) {
    const [log, setLog] = useState([]);
    useEffect(() => {
        fetch("/api/log")
            .then((r) => (r.ok ? r.json() : []))
            .then(setLog)
            .catch(() => {});
    }, [state]);
    return log;
}
