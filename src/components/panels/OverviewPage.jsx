import React from "react";
import Shell from "../Shell.jsx";
import { ArrowRightIcon, BulbIcon, DeviceList, DoorIcon, LIGHTS, MoonIcon, SectionTitle, ShutterIcon, SunIcon, cx, doorLabel, shutterLabel } from "../ui.jsx";
import { useLog, useOffice } from "../../lib/useOffice.js";

const SOURCES = { CP4N: "Crestron", "Web-App": "Web-App", Klingel: "Klingel" };

export default function OverviewPage() {
    const office = useOffice();
    const { state, online, busy, scene } = office;
    const log = useLog(state);
    const disabled = !state?.connected;
    const lightsOn = LIGHTS.filter((l) => state?.lights?.[l.id]).length;

    const areas = [
        { href: "/slidingdoor", title: "Schiebetür", value: state ? doorLabel(state.door) : "–", icon: DoorIcon },
        { href: "/light", title: "Licht", value: state ? `${lightsOn} von ${LIGHTS.length} an` : "–", icon: BulbIcon },
        { href: "/rollershutter", title: "Rolltor", value: state ? shutterLabel(state.shutter) : "–", icon: ShutterIcon },
    ];

    return (
        <Shell
            office={office}
            current="/"
            eyebrow="CATEON · SCHWEGENHEIM"
            title="Office"
            strong="Control"
            intro="Tür, Licht und Rolltor im Büro. Zeigt immer den echten Zustand, egal wer geschaltet hat."
        >
            <section aria-labelledby="szenen" className="flex flex-col gap-3">
                <SectionTitle id="szenen">SZENEN</SectionTitle>
                <div className="grid grid-cols-2 gap-3 sm:max-w-xl">
                    <button
                        type="button"
                        disabled={disabled || busy === "scene:start"}
                        onClick={() => scene("start")}
                        className={cx("flex min-h-[92px] flex-col justify-between gap-2 rounded-2xl border-0 bg-white p-4 text-left text-ll-bg transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50", busy === "scene:start" && "animate-pulse")}
                    >
                        <SunIcon className="h-[22px] w-[22px]" />
                        <span className="text-[17px] font-bold">Arbeitsbeginn</span>
                        <span className="text-sm leading-snug text-gray-600">Tür Automatik, Decke an</span>
                    </button>
                    <button
                        type="button"
                        disabled={disabled || busy === "scene:end"}
                        onClick={() => scene("end")}
                        className={cx("flex min-h-[92px] flex-col justify-between gap-2 rounded-2xl border border-white/15 bg-ll-card p-4 text-left text-white transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50", busy === "scene:end" && "animate-pulse")}
                    >
                        <MoonIcon className="h-[22px] w-[22px]" />
                        <span className="text-[17px] font-bold">Feierabend</span>
                        <span className="text-sm leading-snug text-white/65">Tür Feierabend, alle Lichter aus</span>
                    </button>
                </div>
            </section>

            <section aria-labelledby="bereiche" className="flex flex-col gap-3">
                <SectionTitle id="bereiche">BEREICHE</SectionTitle>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {areas.map(({ href, title, value, icon: Icon }) => (
                        <a
                            key={href}
                            href={href}
                            className="group flex min-h-[150px] flex-col justify-between gap-4 rounded-[20px] border border-white/10 bg-ll-surface p-5 text-white no-underline transition hover:border-ll-accent/50 lg:p-6"
                        >
                            <Icon className="h-9 w-9 text-ll-accent" />
                            <span className="flex flex-col gap-1.5">
                                <span className="text-[15px] text-white/65">{title}</span>
                                <span className="text-[24px] font-bold">{value}</span>
                            </span>
                            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-ll-accent">
                                Öffnen <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </span>
                        </a>
                    ))}
                </div>
            </section>

            <section aria-labelledby="protokoll" className="flex flex-col gap-3">
                <SectionTitle id="protokoll">PROTOKOLL</SectionTitle>
                {log.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-ll-surface px-5 py-6 text-[15px] text-white/65">
                        Noch keine Einträge seit dem letzten Neustart des Servers.
                    </div>
                ) : (
                    <ul className="m-0 flex list-none flex-col overflow-hidden rounded-2xl border border-white/10 p-0">
                        {log.slice(0, 15).map((e, i) => (
                            <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/[0.06] bg-ll-surface px-4 py-3 text-[15px] last:border-b-0">
                                <span className="min-w-[48px] font-semibold tabular-nums">
                                    {new Date(e.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span className="min-w-[80px] text-ll-accent">{SOURCES[e.source] ?? e.source}</span>
                                <span className="flex-1 text-white/75">{e.text}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <DeviceList state={state} online={online} className="lg:hidden" />
        </Shell>
    );
}
