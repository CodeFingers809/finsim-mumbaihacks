"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockHeat {
    symbol: string;
    name: string;
    change: number;
    sector: string;
}

interface WatchlistHeatmapProps {
    quotes: Record<string, MarketQuote>;
    watchlist?: Watchlist;
    isLoading: boolean;
}

export function WatchlistHeatmap({
    quotes,
    watchlist,
    isLoading,
}: WatchlistHeatmapProps) {
    if (isLoading) {
        return (
            <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                    Market Heatmap
                </h3>
                <div className="mb-4">
                    <div className="mb-2 text-[10px] text-[#8b8f9a]">
                        Sector Performance
                    </div>
                    <div className="space-y-1.5">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-20 h-3 bg-[#2d303a]/50 rounded animate-pulse" />
                                <div className="flex-1 h-5 bg-[#0c0d10] rounded-lg">
                                    <div className="h-full w-1/2 bg-[#2d303a]/50 rounded-lg animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((col) => (
                        <div key={col}>
                            <div className="mb-2 h-3 w-16 bg-[#2d303a]/50 rounded animate-pulse" />
                            <div className="space-y-1.5">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="rounded-lg bg-[#0c0d10] p-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="h-3 w-12 bg-[#2d303a]/50 rounded animate-pulse" />
                                                <div className="h-2 w-8 bg-[#2d303a]/50 rounded animate-pulse" />
                                            </div>
                                            <div className="h-3 w-10 bg-[#2d303a]/50 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!watchlist || watchlist.stocks.length === 0) {
        return (
            <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                    Market Heatmap
                </h3>
                <p className="text-xs text-[#8b8f9a]">
                    Add stocks to your watchlist to see performance data
                </p>
            </div>
        );
    }

    // Get stocks with quotes and sort by change percent
    const stocksWithQuotes = watchlist.stocks
        .map((stock) => ({
            symbol: stock.symbol,
            name: stock.symbol,
            quote: quotes[stock.symbol],
        }))
        .filter((item) => item.quote);

    const sortedByChange = [...stocksWithQuotes].sort(
        (a, b) => (b.quote?.changePercent || 0) - (a.quote?.changePercent || 0)
    );

    const topGainers: StockHeat[] = sortedByChange
        .filter((item) => (item.quote?.changePercent || 0) > 0)
        .slice(0, 3)
        .map((item) => ({
            symbol: item.symbol,
            name: item.name,
            change: item.quote?.changePercent || 0,
            sector: "Market",
        }));

    const topLosers: StockHeat[] = sortedByChange
        .filter((item) => (item.quote?.changePercent || 0) < 0)
        .slice(-3)
        .reverse()
        .map((item) => ({
            symbol: item.symbol,
            name: item.name,
            change: item.quote?.changePercent || 0,
            sector: "Market",
        }));

    // Calculate average performance
    const avgChange =
        stocksWithQuotes.length > 0
            ? stocksWithQuotes.reduce(
                  (sum, item) => sum + (item.quote?.changePercent || 0),
                  0
              ) / stocksWithQuotes.length
            : 0;

    const sectorPerformance = [
        {
            name: "Watchlist Avg",
            change: avgChange,
            color: avgChange >= 0 ? "bg-[#4ade80]" : "bg-[#f87171]",
        },
    ];

    return (
        <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                Market Heatmap
            </h3>

            {/* Sector Performance */}
            <div className="mb-4">
                <div className="mb-2 text-[10px] text-[#8b8f9a]">
                    Sector Performance
                </div>
                <div className="space-y-1.5">
                    {sectorPerformance.map((sector) => (
                        <div
                            key={sector.name}
                            className="flex items-center gap-2"
                        >
                            <div className="w-20 text-[10px] text-[#8b8f9a]">
                                {sector.name}
                            </div>
                            <div className="flex-1">
                                <div className="h-5 rounded-lg bg-[#0c0d10]">
                                    <div
                                        className={`h-full rounded-lg ${
                                            sector.color === "bg-[#4ade80]"
                                                ? "bg-[#3dd68c]"
                                                : "bg-[#f06c6c]"
                                        } flex items-center justify-end px-2`}
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.abs(sector.change) * 20
                                            )}%`,
                                        }}
                                    >
                                        <span className="text-[10px] font-medium text-white">
                                            {sector.change.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Gainers & Losers */}
            <div className="grid grid-cols-2 gap-3">
                {/* Top Gainers */}
                <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] text-[#8b8f9a]">
                        <TrendingUp className="h-3 w-3 text-[#3dd68c]" />
                        Watchlist
                    </div>
                    <div className="space-y-1.5">
                        {topGainers.map((stock) => (
                            <div
                                key={stock.symbol}
                                className="rounded-lg bg-[#0c0d10] p-2 hover:bg-[#252730] cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-medium text-[#e8eaed]">
                                            {stock.symbol}
                                        </div>
                                        <div className="text-[9px] text-[#8b8f9a]">
                                            {stock.sector}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-semibold text-[#3dd68c]">
                                        +{stock.change.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Losers */}
                <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] text-[#8b8f9a]">
                        <TrendingDown className="h-3 w-3 text-[#f06c6c]" />
                        Losers
                    </div>
                    <div className="space-y-1.5">
                        {topLosers.map((stock) => (
                            <div
                                key={stock.symbol}
                                className="rounded-lg bg-[#0c0d10] p-2 hover:bg-[#252730] cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-medium text-[#e8eaed]">
                                            {stock.symbol}
                                        </div>
                                        <div className="text-[9px] text-[#8b8f9a]">
                                            {stock.sector}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-semibold text-[#f06c6c]">
                                        {stock.change.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

