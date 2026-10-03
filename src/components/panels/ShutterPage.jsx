import React from "react";
import Shell from "../Shell.jsx";
import { ArrowDownIcon, ArrowUpIcon, Card, StopIcon, cx, shutterLabel } from "../ui.jsx";
import { useOffice } from "../../lib/useOffice.js";

const BUTTONS = [
    { cmd: "ROLLLADEN AUF", label: "Auf", icon: ArrowUpIcon },
    { cmd: "ROLLLADEN STOPP", label: "Stopp", icon: StopIcon, stop: true },
    { cmd: "ROLLLADEN ZU", label: "Zu", icon: ArrowDownIcon },
];

export default function ShutterPage() {
    const office = useOffice();
    const { state, busy, send } = office;
    const moving = state?.shutter && !state.shutter.toUpperCase().startsWith("STEHT");

    return (
        <Shell office={office} current="/rollershutter" eyebrow="TOR" title="" strong="Rolltor" intro="Fährt bis zu 60 Sekunden in eine Richtung und hält dann selbst an. Stopp hält sofort an.">
            <Card id="rolltor" title="STEUERUNG" className="max-w-3xl">
                <div className="flex flex-col gap-1.5" aria-live="polite">
                    <span className={cx("text-[34px] font-bold tracking-tight", moving && "text-ll-accent-bright")}>
                        {state ? shutterLabel(state.shutter) : "–"}
                    </span>
                    <span className="text-[15px] text-white/65">Meldung vom Crestron: {state?.shutter ?? "–"}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {BUTTONS.map(({ cmd, label, icon: Icon, stop }) => (
                        <button
                            key={cmd}
                            type="button"
                            // Stopp bleibt auch ohne bekannten Zustand bedienbar, solange der CP4N verbunden ist.
                            disabled={!state?.connected || busy === cmd}
                            onClick={() => send(cmd)}
                            className={cx(
                                "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-[20px] border text-[19px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                                stop
                                    ? "border-white bg-white text-ll-bg hover:bg-neutral-100"
                                    : "border-white/15 bg-ll-raised text-white hover:border-white/25",
                                busy === cmd && "animate-pulse",
                            )}
                        >
                            <Icon className="h-9 w-9" />
                            {label}
                        </button>
                    ))}
                </div>
            </Card>
        </Shell>
    );
}
