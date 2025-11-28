"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    Calendar,
    TrendingUp,
    TrendingDown,
    Search,
    ExternalLink,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EarningsEvent {
    symbol: string;
    companyName: string;
    date: string;
    time?: string;
    epsEstimate: number | null;
    epsActual: number | null;
    revenueEstimate: number | null;
    revenueActual: number | null;
    fiscalDateEnding?: string;
}

export function EarningsCalendarTab() {
    const router = useRouter();
    const [searchSymbol, setSearchSymbol] = useState("");
    const [activeView, setActiveView] = useState<"upcoming" | "past">(
        "upcoming"
    );
    const [fromDate] = useState(new Date().toISOString().split("T")[0]);
    const [toDate] = useState(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
    );

    const { data: earnings, isLoading } = useQuery<EarningsEvent[]>({
        queryKey: ["earnings", fromDate, toDate, searchSymbol],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchSymbol) {
                params.append("symbol", searchSymbol);
            } else {
                params.append("from", fromDate);
                params.append("to", toDate);
            }

            const response = await fetch(
                `/api/earnings/calendar?${params.toString()}`
            );
            if (!response.ok)
                throw new Error("Failed to fetch earnings calendar");
            return response.json();
        },
        refetchInterval: 300000,
    });

    const handleStockClick = (symbol: string) => {
        router.push(`/stock/${symbol}`);
    };

    const formatCurrency = (num: number | null) => {
        if (num === null) return "N/A";
        return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    };

    const formatRevenue = (num: number | null) => {
        if (num === null) return "N/A";
        if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
        if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
        return `₹${num.toLocaleString("en-IN")}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getEarningsSurprise = (
        actual: number | null,
        estimate: number | null
    ) => {
        if (actual === null || estimate === null || estimate === 0) return null;
        const surprise = ((actual - estimate) / Math.abs(estimate)) * 100;
        return surprise;
    };

    const upcomingEarnings =
        earnings?.filter((e) => e.epsActual === null) || [];
    const pastEarnings = earnings?.filter((e) => e.epsActual !== null) || [];
    const displayEarnings =
        activeView === "upcoming" ? upcomingEarnings : pastEarnings;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[#e8eaed]">
                        Earnings Calendar
                    </h2>
                    <p className="text-xs text-[#8b8f9a]">
                        Upcoming earnings reports and historical results
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8f9a]" />
                    <input
                        placeholder="Search by symbol (e.g., RELIANCE)"
                        value={searchSymbol}
                        onChange={(e) =>
                            setSearchSymbol(e.target.value.toUpperCase())
                        }
                        className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#1a1d24] pl-10 pr-4 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-lg">
                    {[
                        { id: "upcoming", label: "Upcoming", icon: Clock },
                        {
                            id: "past",
                            label: "Past Results",
                            icon: CheckCircle,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                                activeView === tab.id
                                    ? "bg-[#6c8cff] text-white shadow-md"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="h-16 rounded-xl bg-[#1a1d24] animate-pulse"
                        />
                    ))}
                </div>
            ) : displayEarnings.length > 0 ? (
                <div className="space-y-2">
                    {/* Header Row */}
                    <div
                        className={cn(
                            "grid gap-4 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]",
                            activeView === "upcoming"
                                ? "grid-cols-5"
                                : "grid-cols-7"
                        )}
                    >
                        <div>Date</div>
                        <div className="col-span-2">Company</div>
                        <div className="text-right">EPS Est.</div>
                        {activeView === "upcoming" ? (
                            <div className="text-right">Time</div>
                        ) : (
                            <>
                                <div className="text-right">EPS Actual</div>
                                <div className="text-right">Revenue</div>
                                <div className="text-right">Surprise</div>
                            </>
                        )}
                    </div>

                    {/* Data Rows */}
                    {displayEarnings.slice(0, 15).map((event, idx) => {
                        const surprise = getEarningsSurprise(
                            event.epsActual,
                            event.epsEstimate
                        );
                        const isBeat = surprise !== null && surprise > 0;

                        return (
                            <div
                                key={`${event.symbol}-${idx}`}
                                onClick={() => handleStockClick(event.symbol)}
                                className={cn(
                                    "group grid gap-4 items-center px-4 py-3 rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] cursor-pointer transition-all duration-200 hover:border-[#6c8cff]/40 hover:bg-[#1e2028]",
                                    activeView === "upcoming"
                                        ? "grid-cols-5"
                                        : "grid-cols-7"
                                )}
                            >
                                {/* Date */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-[#6c8cff]" />
                                    <span className="text-xs text-[#e8eaed]">
                                        {formatDate(event.date)}
                                    </span>
                                </div>

                                {/* Company Info */}
                                <div className="col-span-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-[#e8eaed]">
                                            {event.symbol}
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-[#6c8cff] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-[10px] text-[#8b8f9a] line-clamp-1">
                                        {event.companyName}
                                    </span>
                                </div>

                                {/* EPS Estimate */}
                                <div className="text-right">
                                    <span className="text-sm font-mono text-[#e8eaed]">
                                        {formatCurrency(event.epsEstimate)}
                                    </span>
                                </div>

                                {activeView === "upcoming" ? (
                                    /* Time */
                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#6c8cff]/15 text-[#6c8cff] text-xs font-medium">
                                            <Clock className="h-3 w-3" />
                                            {event.time || "TBA"}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        {/* EPS Actual */}
                                        <div className="text-right">
                                            <span
                                                className={cn(
                                                    "text-sm font-mono font-medium",
                                                    isBeat
                                                        ? "text-[#3dd68c]"
                                                        : "text-[#f06c6c]"
                                                )}
                                            >
                                                {formatCurrency(
                                                    event.epsActual
                                                )}
                                            </span>
                                        </div>

                                        {/* Revenue */}
                                        <div className="text-right">
                                            <span className="text-sm font-mono text-[#8b8f9a]">
                                                {formatRevenue(
                                                    event.revenueActual
                                                )}
                                            </span>
                                        </div>

                                        {/* Surprise */}
                                        <div className="text-right">
                                            {surprise !== null ? (
                                                <div
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold",
                                                        isBeat
                                                            ? "bg-[#3dd68c]/15 text-[#3dd68c]"
                                                            : "bg-[#f06c6c]/15 text-[#f06c6c]"
                                                    )}
                                                >
                                                    {isBeat ? (
                                                        <TrendingUp className="h-3 w-3" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3" />
                                                    )}
                                                    {isBeat ? "+" : ""}
                                                    {surprise.toFixed(1)}%
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[#8b8f9a]">
                                                    N/A
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-[#8b8f9a]">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                        No {activeView === "upcoming" ? "upcoming" : "past"}{" "}
                        earnings found
                    </p>
                </div>
            )}
        </div>
    );
}

