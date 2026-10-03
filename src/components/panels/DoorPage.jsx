import React from "react";
import Shell from "../Shell.jsx";
import { Card, DOOR_MODES, DoorIcon, cx } from "../ui.jsx";
import { useOffice } from "../../lib/useOffice.js";

export default function DoorPage() {
    const office = useOffice();
    const { state, busy, send } = office;
    const current = DOOR_MODES.find((m) => m.id === state?.door);
    const disabled = !state?.connected;

    return (
        <Shell office={office} current="/slidingdoor" eyebrow="EINGANG" title="" strong="Schiebetür" intro="Betriebsart der Eingangstür. Die Klingel stellt bei erkannter Person auf Automatik.">
            <Card id="tuer" title="BETRIEBSART" className="max-w-3xl">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5" aria-live="polite">
                        <span className="text-[34px] font-bold tracking-tight">{current?.label ?? "–"}</span>
                        <span className="text-[15px] text-white/65">{current?.hint ?? "Zustand wird geladen"}</span>
                    </div>
                    <DoorIcon className="h-11 w-11 text-ll-accent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {DOOR_MODES.map((m) => {
                        const active = m.id === state?.door;
                        const cmd = `TUER ${m.id}`;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                aria-pressed={active}
                                disabled={disabled || busy === cmd}
                                onClick={() => send(cmd)}
                                className={cx(
                                    "flex min-h-[84px] flex-col gap-1 rounded-2xl border p-4 text-left text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                                    active
                                        ? "border-ll-accent bg-ll-accent/15 shadow-[0_0_24px_rgba(77,184,255,0.25)]"
                                        : "border-white/10 bg-ll-raised hover:border-white/20",
                                    busy === cmd && "animate-pulse",
                                )}
                            >
                                <span className="text-[17px] font-semibold">{m.label}</span>
                                <span className="text-[13px] text-white/60">Relais {m.relay}</span>
                            </button>
                        );
                    })}
                </div>
            </Card>
        </Shell>
    );
}
