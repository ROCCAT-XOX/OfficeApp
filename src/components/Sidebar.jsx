import React, { useState } from "react";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    TransitionChild,
} from "@headlessui/react";
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    UsersIcon, LightBulbIcon,
} from "@heroicons/react/24/outline";

/**
 * Array mit nur zwei Navigationseinträgen:
 * - Schiebetür
 * - Rolltor
 */

const navigation = [
    { name: "Light", href: "/light", icon: LightBulbIcon, current: false },
    { name: "Sliding Door", href: "/slidingdoor", icon: HomeIcon, current: false },
    { name: "Roller Shutter", href: "/rollershutter", icon: UsersIcon, current: false },

];


/**
 * Hilfsfunktion zum Zusammenfügen von Klassen.
 */
function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div>
            {/* Off-canvas menu for mobile */}
            <Dialog
                open={sidebarOpen}
                onClose={setSidebarOpen}
                className="relative z-50 lg:hidden"
            >
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
                />

                <div className="fixed inset-0 flex">
                    <DialogPanel
                        transition
                        className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
                    >
                        <TransitionChild>
                            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(false)}
                                    className="-m-2.5 p-2.5"
                                >
                                    <span className="sr-only">Close sidebar</span>
                                    <XMarkIcon
                                        aria-hidden="true"
                                        className="size-6 text-white"
                                    />
                                </button>
                            </div>
                        </TransitionChild>

                        {/* Sidebar (Mobile) */}
                        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
                            <div className="flex h-16 shrink-0 items-center">
                                <img
                                    alt="CATEON"
                                    src="/Icon_White_CATEON.png"
                                    className="h-8 w-auto"
                                />
                            </div>
                            <nav className="flex flex-1 flex-col">
                                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        <ul role="list" className="-mx-2 space-y-1">
                                            {navigation.map((item) => (
                                                <li key={item.name}>
                                                    <a
                                                        href={item.href}
                                                        className={classNames(
                                                            item.current
                                                                ? "bg-indigo-700 text-white"
                                                                : "text-indigo-200 hover:bg-indigo-700 hover:text-white",
                                                            "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                                                        )}
                                                    >
                                                        <item.icon
                                                            aria-hidden="true"
                                                            className={classNames(
                                                                item.current
                                                                    ? "text-white"
                                                                    : "text-indigo-200 group-hover:text-white",
                                                                "size-6 shrink-0"
                                                            )}
                                                        />
                                                        {item.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                        <img
                            alt="CATEON"
                            src="/LOGO_CATEON_KLEIN_Weiss.png"
                            className="h-8 w-auto"
                        />
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <a
                                                href={item.href}
                                                className={classNames(
                                                    item.current
                                                        ? "bg-indigo-700 text-white"
                                                        : "text-indigo-200 hover:bg-indigo-700 hover:text-white",
                                                    "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                                                )}
                                            >
                                                <item.icon
                                                    aria-hidden="true"
                                                    className={classNames(
                                                        item.current ? "text-white" : "text-indigo-200 group-hover:text-white",
                                                        "size-6 shrink-0"
                                                    )}
                                                />
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Header-Bereich (optional) */}
            <div className="lg:pl-72">
                <div
                    className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4
          border-b border-gray-200 bg-white px-4 shadow-xs
          sm:gap-x-6 sm:px-6 lg:px-8"
                >
                    {/* Hamburger-Button für Mobile */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>

                    <div
                        aria-hidden="true"
                        className="h-6 w-px bg-gray-900/10 lg:hidden"
                    />

                    {/* Platz für Suchfeld / weitere Inhalte */}
                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        {/* ... */}
                    </div>
                </div>

                {/* Main-Content */}
                <main className="py-4 px-4 sm:px-6 lg:px-8">
                    {/* Main-Content from Pages */}
                </main>
            </div>
        </div>
    );
}
