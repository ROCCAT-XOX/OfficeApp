import React, { useState, useEffect } from "react";
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
    LightBulbIcon,
    ArrowRightOnRectangleIcon,
    WindowIcon,
} from "@heroicons/react/24/outline";

const navigation = [
    { name: "Home", href: "/", icon: HomeIcon, current: false },
    { name: "Light", href: "/light", icon: LightBulbIcon, current: false },
    { name: "Sliding Door", href: "/slidingdoor", icon: ArrowRightOnRectangleIcon, current: false },
    { name: "Roller Shutter", href: "/rollershutter", icon: WindowIcon, current: false },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState("");

    // Determine current page on component mount
    useEffect(() => {
        const path = window.location.pathname;
        setCurrentPage(path);
    }, []);

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

                        {/* Mobile Sidebar */}
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
                                                            currentPage === item.href
                                                                ? "bg-indigo-700 text-white"
                                                                : "text-indigo-200 hover:bg-indigo-700 hover:text-white",
                                                            "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                                                        )}
                                                        onClick={() => {
                                                            setCurrentPage(item.href);
                                                            setSidebarOpen(false);
                                                        }}
                                                    >
                                                        <item.icon
                                                            aria-hidden="true"
                                                            className={classNames(
                                                                currentPage === item.href
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
                                                    currentPage === item.href
                                                        ? "bg-indigo-700 text-white"
                                                        : "text-indigo-200 hover:bg-indigo-700 hover:text-white",
                                                    "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                                                )}
                                                onClick={() => setCurrentPage(item.href)}
                                            >
                                                <item.icon
                                                    aria-hidden="true"
                                                    className={classNames(
                                                        currentPage === item.href ? "text-white" : "text-indigo-200 group-hover:text-white",
                                                        "size-6 shrink-0"
                                                    )}
                                                />
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </li>

                            <li className="mt-auto">
                                <div className="p-4 bg-indigo-700 rounded-lg">
                                    <p className="text-xs font-medium text-indigo-200">
                                        Office Control System
                                    </p>
                                    <p className="text-xs text-indigo-200 mt-1">
                                        Connected to backend
                                    </p>
                                    <div className="flex items-center mt-3">
                                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                                        <span className="text-xs text-indigo-200 ml-2">System Online</span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Header area */}
            <div className="lg:pl-72">
                <div
                    className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4
                    border-b border-gray-200 bg-white px-4 shadow-xs
                    sm:gap-x-6 sm:px-6 lg:px-8"
                >
                    {/* Hamburger menu button for mobile */}
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

                    {/* Page title and breadcrumb */}
                    <div className="flex flex-1 gap-x-4 self-stretch items-center">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {navigation.find(item => item.href === currentPage)?.name || "Office Control"}
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
}