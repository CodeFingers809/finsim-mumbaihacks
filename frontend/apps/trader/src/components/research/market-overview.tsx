"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import { TrendingUp, TrendingDown, Activity, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MarketOverviewProps {
    quotes: Record<string, MarketQuote>;
    watchlist?: Watchlist;
    isLoading: boolean;
}

export function MarketOverview({
    quotes,
    watchlist,
    isLoading,
}: MarketOverviewProps) {
    if (!watchlist || watchlist.stocks.length === 0) {
        return (
            <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Watchlist Overview
                    </h3>
                </div>
                <p className="text-sm text-[#8b8f9a]">
                    Add stocks to your watchlist to see market overview
                </p>
            </div>
        );
    }

    // Get top 2 stocks by market cap or first 2 stocks
    const topStocks = watchlist.stocks.slice(0, 2);

    if (isLoading) {
        return (
            <div className="grid gap-3">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-28 rounded-xl bg-[#1a1d24] animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#6c8cff]" />
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                    Top Performers
                </h3>
            </div>

            <div className="grid gap-3">
                {topStocks.map((stock) => {
                    const quote = quotes[stock.symbol];
                    const price = quote?.lastPrice || 0;
                    if (!quote || typeof price !== "number") return null;

                    const changePercent = quote.changePercent || 0;
                    const change = quote.change || 0;
                    const isPositive = change >= 0;

                    // Calculate range position for progress bar
                    const dayHigh = quote.dayHigh || price * 1.05;
                    const dayLow = quote.dayLow || price * 0.95;
                    const rangePosition =
                        dayHigh !== dayLow
                            ? ((price - dayLow) / (dayHigh - dayLow)) * 100
                            : 50;

                    return (
                        <div
                            key={stock.symbol}
                            className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#e8eaed]">
                                            {stock.symbol}
                                        </p>
                                        {isPositive ? (
                                            <TrendingUp className="h-3 w-3 text-[#3dd68c]" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3 text-[#f06c6c]" />
                                        )}
                                    </div>
                                    <p className="text-lg font-bold font-mono text-[#e8eaed] mt-0.5">
                                        ₹
                                        {price.toLocaleString("en-IN", {
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                                <div
                                    className={cn(
                                        "text-right px-2 py-1 rounded-lg",
                                        isPositive
                                            ? "bg-[#3dd68c]/15"
                                            : "bg-[#f06c6c]/15"
                                    )}
                                >
                                    <p
                                        className={cn(
                                            "text-sm font-bold font-mono",
                                            isPositive
                                                ? "text-[#3dd68c]"
                                                : "text-[#f06c6c]"
                                        )}
                                    >
                                        {change >= 0 ? "+" : ""}
                                        {change.toFixed(2)}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-[10px] font-semibold",
                                            isPositive
                                                ? "text-[#3dd68c]"
                                                : "text-[#f06c6c]"
                                        )}
                                    >
                                        {changePercent >= 0 ? "+" : ""}
                                        {changePercent.toFixed(2)}%
                                    </p>
                                </div>
                            </div>

                            {/* Day Range */}
                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between text-[9px] text-[#8b8f9a]">
                                    <span>Day Low</span>
                                    <Activity className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span>Day High</span>
                                </div>
                                <div className="h-1.5 bg-[#2d303a]/50 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            isPositive
                                                ? "bg-[#3dd68c]"
                                                : "bg-[#f06c6c]"
                                        )}
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.max(0, rangePosition)
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px]">
                                    <span className="text-[#8b8f9a] font-mono">
                                        ₹{dayLow.toFixed(2)}
                                    </span>
                                    <span className="text-[#e8eaed] font-mono font-medium">
                                        ₹{price.toFixed(2)}
                                    </span>
                                    <span className="text-[#8b8f9a] font-mono">
                                        ₹{dayHigh.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Additional Metrics */}
                            <div className="grid grid-cols-2 gap-3 pt-2 mt-2 border-t border-[#2d303a]/30">
                                <div>
                                    <p className="text-[10px] text-[#8b8f9a]">
                                        Volume
                                    </p>
                                    <p className="text-xs font-semibold font-mono text-[#e8eaed]">
                                        {quote.volume
                                            ? (quote.volume / 1000000).toFixed(
                                                  2
                                              ) + "M"
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#8b8f9a]">
                                        Prev Close
                                    </p>
                                    <p className="text-xs font-semibold font-mono text-[#e8eaed]">
                                        ₹
                                        {quote.previousClose?.toFixed(2) ||
                                            "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

