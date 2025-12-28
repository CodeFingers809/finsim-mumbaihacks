"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell,
    LayoutDashboard,
    NotebookPen,
    Rocket,
    Wallet,
    LineChart,
    Home,
} from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/research", label: "Research", icon: LayoutDashboard },
    { href: "/backtesting", label: "Backtesting", icon: NotebookPen },
    { href: "/positions", label: "Positions", icon: Wallet },
    { href: "/orders", label: "Orders", icon: Rocket },
    { href: "/alerts", label: "Alerts", icon: Bell },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useUser();

    return (
        <div className="flex min-h-screen bg-background text-white">
            <aside className="hidden w-[240px] border-r border-border bg-black/30 px-4 py-6 lg:block">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-2 text-lg font-semibold"
                >
                    <LineChart className="h-5 w-5 text-primary" /> Sentinel
                </Link>
                <nav className="mt-8 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            pathname === item.href ||
                            (item.href !== "/" &&
                                pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-secondary transition",
                                    active &&
                                        "bg-surface text-white shadow-glow"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-border px-6 py-3.5">
                    <div className="flex items-center gap-8">
                        <div>
                            <h1 className="text-lg font-medium">
                                Hi, {user?.firstName || "User"}
                            </h1>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div>
                                <span className="text-text-secondary">
                                    NIFTY 50
                                </span>
                                <span className="ml-2 font-semibold">
                                    25884.80
                                </span>
                                <span className="ml-1 text-danger">
                                    -74.70 (-0.29%)
                                </span>
                            </div>
                            <div>
                                <span className="text-text-secondary">
                                    SENSEX
                                </span>
                                <span className="ml-2 font-semibold">
                                    84587.01
                                </span>
                                <span className="ml-1 text-danger">
                                    -313.73 (-0.37%)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="rounded-full border border-border bg-surface-muted p-2 hover:bg-surface transition-colors">
                            <Bell className="h-4 w-4" />
                        </button>
                        <UserButton
                            appearance={{
                                elements: { userButtonTrigger: "rounded-full" },
                            }}
                        />
                    </div>
                </header>
                <main className="flex-1 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#050505] px-4 py-6 lg:px-8">
                    <div className="mx-auto max-w-[1600px] space-y-6">
                        {children}
                    </div>
                </main>
                <footer className="border-t border-border/50 px-6 py-2 bg-black/20">
                    <p className="text-[10px] text-gray-500 text-center">
                        * This platform is for informational and educational
                        purposes only. We are not financial advisors. Please
                        consult with a qualified financial professional before
                        making investment decisions.
                    </p>
                </footer>
            </div>
        </div>
    );
}

