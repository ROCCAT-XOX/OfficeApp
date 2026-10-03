import React from "react";

// Gemeinsame Bausteine und Daten für alle Seiten (LeadLift Design System).
// Geschaltet wird ausschließlich über den CP4N (Backend → TCP 9000, network-docs docs/61).

// Türmodi = CP4N-Befehl TUER <id>; dS378 Relais 1–4.
export const DOOR_MODES = [
    { id: "AUTOMATIK", label: "Automatik", relay: 1, hint: "Öffnet auch per Klingel" },
    { id: "OFFEN", label: "Dauerhaft offen", relay: 2, hint: "Tür bleibt offen" },
    { id: "FEIERABEND", label: "Feierabend", relay: 3, hint: "Feierabend-Modus aktiv" },
    { id: "GESCHLOSSEN", label: "Dauerhaft geschlossen", relay: 4, hint: "Tür bleibt geschlossen" },
];

// Lichtkreise = CP4N-Befehl LICHT <id>; ESERA-Ausgang in Klammern (5 = Dimmer Decke).
export const LIGHTS = [
    { id: "TEAMRAUM", label: "Teamraum", output: 1 },
    { id: "LORABELLA", label: "Lorabella", output: 2 },
    { id: "BESPRECHUNG", label: "Besprechung", output: 3 },
    { id: "ARBEITSPLATZ", label: "Arbeitsplatz", output: 4 },
    { id: "EINGANG", label: "Eingang", output: 6 },
    { id: "DECKE", label: "Decke", output: 7 },
    { id: "BLAU", label: "Blau", output: 8 },
];

export const DEVICES = [
    { id: "CP4N", name: "CP4N", address: "10.100.104.2" },
    { id: "ESERA", name: "ESERA (Licht)", address: "10.100.104.20" },
    { id: "DS378", name: "dS378 (Tür, Rolltor)", address: "10.100.104.30" },
];

export function doorLabel(id) {
    return DOOR_MODES.find((m) => m.id === id)?.label ?? "Unbekannt";
}

// ROLLLADEN-Meldung lesbar machen: STEHT, AUF/ZU bzw. FAEHRT AUF …
export function shutterLabel(raw) {
    if (!raw) return "Unbekannt";
    const r = raw.toUpperCase();
    if (r.startsWith("STEHT")) return "Steht";
    if (r.includes("AUF")) return "Fährt auf";
    if (r.includes("ZU")) return "Fährt zu";
    return raw.charAt(0) + raw.slice(1).toLowerCase();
}

export function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

export function SectionTitle({ id, children }) {
    return (
        <h2 id={id} className="m-0 text-[15px] font-semibold tracking-[0.08em] text-ll-accent">
            {children}
        </h2>
    );
}

export function Card({ id, title, aside, children, className }) {
    return (
        <section aria-labelledby={`h-${id}`} className={cx("flex flex-col gap-4 rounded-[20px] border border-white/10 bg-ll-surface p-5 lg:p-6", className)}>
            <div className="flex items-baseline justify-between">
                <SectionTitle id={`h-${id}`}>{title}</SectionTitle>
                {aside && <span className="text-[15px] text-white/65">{aside}</span>}
            </div>
            {children}
        </section>
    );
}

// Hinweis, wenn Backend oder CP4N nicht erreichbar sind, bzw. bei einem Fehler beim Schalten.
export function StatusNotice({ online, state, error, className }) {
    let text = null;
    if (!online) text = "Keine Verbindung zum Server. Die Anzeige ist nicht aktuell.";
    else if (state && !state.connected) text = "Keine Verbindung zum Crestron. Schalten ist gerade nicht möglich.";
    else if (error) text = `Nicht geschaltet: ${error}`;
    if (!text) return null;
    return (
        <p role="status" className={cx("m-0 flex items-center gap-3 rounded-2xl border border-ll-warn/40 bg-ll-warn/10 px-4 py-3 text-[15px] text-amber-100", className)}>
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-ll-warn" />
            {text}
        </p>
    );
}

export function DeviceList({ state, online, className }) {
    const status = (id) => {
        if (!online || !state) return null;
        if (id === "CP4N") return state.connected;
        return state.connected && state.devices?.[id] === "OK";
    };
    return (
        <div className={cx("flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4", className)}>
            <span className="text-[15px] font-semibold tracking-[0.08em] text-ll-accent">GERÄTE</span>
            {DEVICES.map((d) => {
                const ok = status(d.id);
                return (
                    <span key={d.id} className="flex items-center gap-2.5 text-[15px] text-white/75">
                        <span
                            aria-hidden="true"
                            className={cx("h-2 w-2 shrink-0 rounded-full", ok === null ? "bg-white/30" : ok ? "bg-ll-success" : "bg-red-500")}
                        />
                        <span>
                            {d.name} <span className="text-white/50">· {d.address}</span>
                            <span className="sr-only">{ok === null ? " unbekannt" : ok ? " in Ordnung" : " gestört"}</span>
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

const iconProps = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true };

export function HomeIcon(props) {
    return <svg {...iconProps} {...props}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
export function DoorIcon(props) {
    return <svg {...iconProps} {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18M9 12h.01M15 12h.01" /></svg>;
}
export function BulbIcon(props) {
    return <svg {...iconProps} {...props}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></svg>;
}
export function ShutterIcon(props) {
    return <svg {...iconProps} {...props}><path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M3 9h18M3 13h18M3 17h18" /></svg>;
}
export function SunIcon(props) {
    return <svg {...iconProps} {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
}
export function MoonIcon(props) {
    return <svg {...iconProps} {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
}
export function ArrowUpIcon(props) {
    return <svg {...iconProps} strokeWidth={2} {...props}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
}
export function ArrowDownIcon(props) {
    return <svg {...iconProps} strokeWidth={2} {...props}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>;
}
export function ArrowRightIcon(props) {
    return <svg {...iconProps} strokeWidth={2} {...props}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
}
export function StopIcon(props) {
    return <svg {...iconProps} strokeWidth={2} {...props}><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>;
}
