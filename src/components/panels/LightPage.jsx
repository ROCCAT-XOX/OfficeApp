import React, { useEffect, useState } from "react";
import Shell from "../Shell.jsx";
import { Card, LIGHTS, cx } from "../ui.jsx";
import { useOffice } from "../../lib/useOffice.js";

export default function LightPage() {
    const office = useOffice();
    const { state, busy, send } = office;
    const disabled = !state?.connected;
    const lightsOn = LIGHTS.filter((l) => state?.lights?.[l.id]).length;

    return (
        <Shell office={office} current="/light" eyebrow="BELEUCHTUNG" title="Licht" strong="im Büro" intro="Lichtkreise einzeln schalten und die Decke dimmen.">
            <Card id="licht" title="LICHTKREISE" aside={state ? `${lightsOn} von ${LIGHTS.length} an` : null} className="max-w-4xl">
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        disabled={disabled || busy === "LICHT ALLE AUS"}
                        onClick={() => send("LICHT ALLE AUS")}
                        className="min-h-[44px] rounded-full border border-white/25 bg-transparent px-5 text-[15px] font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Alle aus
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {LIGHTS.map((l) => {
                        const on = !!state?.lights?.[l.id];
                        const cmd = `LICHT ${l.id} ${on ? "AUS" : "AN"}`;
                        return (
                            <button
                                key={l.id}
                                type="button"
                                aria-pressed={on}
                                disabled={disabled || busy === cmd}
                                onClick={() => send(cmd)}
                                className={cx(
                                    "flex min-h-[84px] flex-col gap-1 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                                    on ? "border-white bg-white text-ll-bg" : "border-white/10 bg-ll-raised text-white hover:border-white/20",
                                    busy === cmd && "animate-pulse",
                                )}
                            >
                                <span className="flex w-full items-center justify-between">
                                    <span className="text-[17px] font-semibold">{l.label}</span>
                                    <span
                                        aria-hidden="true"
                                        className={cx("h-2.5 w-2.5 rounded-full", on ? "bg-ll-accent-deep shadow-[0_0_10px_#4DB8FF]" : "bg-white/25")}
                                    />
                                </span>
                                <span className={cx("text-[13px]", on ? "text-gray-600" : "text-white/60")}>{state ? (on ? "An" : "Aus") : "–"}</span>
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Dimmer value={state?.dimmer} disabled={disabled} busy={busy} send={send} />
        </Shell>
    );
}

// Dimmer Decke (ESERA 5): Wert wird beim Loslassen gesendet; der CP4N meldet den Ist-Wert zurück.
function Dimmer({ value, disabled, busy, send }) {
    const [draft, setDraft] = useState(null);
    useEffect(() => setDraft(null), [value]);
    const shown = draft ?? (value >= 0 ? value : 0);
    const commit = () => {
        if (draft !== null && draft !== value) send(`DIMMER ${draft}`);
    };

    return (
        <Card id="dimmer" title="DIMMER DECKE" aside={value >= 0 ? `${value} %` : null} className="max-w-4xl">
            <label htmlFor="dimmer-range" className="sr-only">Helligkeit Decke in Prozent</label>
            <input
                id="dimmer-range"
                type="range"
                min="0"
                max="100"
                step="5"
                value={shown}
                disabled={disabled}
                onChange={(e) => setDraft(Number(e.target.value))}
                onPointerUp={commit}
                onKeyUp={commit}
                className="h-11 w-full cursor-pointer accent-[#4DB8FF] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex flex-wrap gap-3">
                {[
                    ["DIMMER MIN", "Minimum"],
                    ["DIMMER 50", "50 %"],
                    ["DIMMER MAX", "Maximum"],
                ].map(([cmd, label]) => (
                    <button
                        key={cmd}
                        type="button"
                        disabled={disabled || busy === cmd}
                        onClick={() => send(cmd)}
                        className="min-h-[44px] rounded-full border border-white/25 bg-transparent px-5 text-[15px] font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {label}
                    </button>
                ))}
            </div>
            <span className="text-sm text-white/55">Der Dimmer fährt langsam (ganzer Weg etwa 4,5 s); der Wert aktualisiert sich danach.</span>
        </Card>
    );
}
