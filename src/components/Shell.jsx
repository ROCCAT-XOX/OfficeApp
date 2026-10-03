import React from "react";
import { BulbIcon, DeviceList, DoorIcon, HomeIcon, ShutterIcon, StatusNotice, cx } from "./ui.jsx";

export const NAV = [
    { href: "/", label: "Übersicht", icon: HomeIcon },
    { href: "/slidingdoor", label: "Schiebetür", icon: DoorIcon },
    { href: "/light", label: "Licht", icon: BulbIcon },
    { href: "/rollershutter", label: "Rolltor", icon: ShutterIcon },
];

// Rahmen jeder Seite: Menü links (Desktop) bzw. unten (Handy), Kopf mit Titel, Verbindungshinweis.
export default function Shell({ current, eyebrow, title, strong, intro, office, children }) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-72 -right-48 h-[600px] w-[900px] rounded-full"
                style={{ background: "radial-gradient(closest-side, rgba(30,111,186,0.45), rgba(30,111,186,0))" }}
            />

            <div className="relative flex flex-col lg:flex-row">
                <nav aria-label="Hauptnavigation" className="hidden lg:flex lg:min-h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:gap-8 lg:border-r lg:border-white/10 lg:px-5 lg:py-8">
                    <a href="/" className="flex flex-col gap-1.5 text-white no-underline">
                        <span className="text-[15px] font-semibold tracking-[0.08em] text-ll-accent">CATEON</span>
                        <span className="text-2xl font-normal tracking-tight">
                            Office <b className="font-bold">Control</b>
                        </span>
                    </a>
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                        {NAV.map(({ href, label, icon: Icon }) => {
                            const active = href === current;
                            return (
                                <li key={href}>
                                    <a
                                        href={href}
                                        aria-current={active ? "page" : undefined}
                                        className={cx(
                                            "flex items-center gap-3 rounded-xl px-3.5 py-3 text-base no-underline transition",
                                            active ? "bg-ll-accent/10 font-semibold text-white" : "text-white/75 hover:bg-white/5 hover:text-white",
                                        )}
                                    >
                                        <Icon className={cx("h-5 w-5", active && "text-ll-accent")} />
                                        {label}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                    <DeviceList state={office.state} online={office.online} className="mt-auto" />
                </nav>

                <main className="flex min-w-0 flex-1 flex-col gap-8 px-5 pb-32 pt-7 sm:px-8 lg:px-12 lg:pb-14 lg:pt-10">
                    <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex flex-col gap-3">
                            <span className="text-[15px] font-semibold tracking-[0.08em] text-ll-accent">{eyebrow}</span>
                            <h1 className="m-0 text-[40px] font-normal leading-[1.06] tracking-tight lg:text-[44px]">
                                {title} <b className="font-bold">{strong}</b>
                            </h1>
                            {intro && <p className="m-0 max-w-xl text-[17px] leading-relaxed text-white/70">{intro}</p>}
                        </div>
                        <StatusNotice online={office.online} state={office.state} error={office.error} className="xl:max-w-md" />
                    </header>

                    {children}
                </main>
            </div>

            {/* Menüleiste unten (Handy/Tablet) */}
            <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-ll-bg/95 backdrop-blur lg:hidden">
                <ul className="m-0 grid list-none grid-cols-4 p-0 pb-[env(safe-area-inset-bottom)]">
                    {NAV.map(({ href, label, icon: Icon }) => {
                        const active = href === current;
                        return (
                            <li key={href}>
                                <a
                                    href={href}
                                    aria-current={active ? "page" : undefined}
                                    className={cx(
                                        "flex min-h-[64px] flex-col items-center justify-center gap-1 text-[13px] no-underline",
                                        active ? "font-semibold text-ll-accent" : "text-white/70",
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                    {label}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
