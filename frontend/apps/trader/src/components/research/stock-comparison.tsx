"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/charts/sparkline";
import { ArrowUp, ArrowDown, Activity, BarChart3, Zap } from "lucide-react";

interface StockComparisonProps {
    quotes: Record<string, MarketQuote>;
    watchlist?: Watchlist;
    isLoading: boolean;
}

export function StockComparison({
    quotes,
    watchlist,
    isLoading,
}: StockComparisonProps) {
    if (!watchlist || watchlist.stocks.length === 0) {
        return (
            <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Stock Comparison
                    </h3>
                </div>
                <p className="text-sm text-[#8b8f9a]">
                    Add stocks to your watchlist to compare them
                </p>
            </div>
        );
    }

    const stocksWithQuotes = watchlist.stocks
        .map((stock) => ({
            symbol: stock.symbol,
            quote: quotes[stock.symbol],
        }))
        .filter(
            (item) => item.quote && typeof item.quote.lastPrice === "number"
        )
        .slice(0, 5); // Show top 5 stocks

    if (stocksWithQuotes.length === 0) {
        return (
            <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Stock Comparison
                    </h3>
                </div>
                <p className="text-sm text-[#8b8f9a]">Loading stock data...</p>
            </div>
        );
    }

    // Calculate max values for visual scaling
    const maxVolume = Math.max(
        ...stocksWithQuotes.map((s) => s.quote.volume || 0)
    );
    const maxPrice = Math.max(
        ...stocksWithQuotes.map((s) => s.quote.lastPrice)
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Analysis
                    </h3>
                </div>
            </div>

            {/* Visual Comparison Cards */}
            <div className="space-y-3">
                {stocksWithQuotes.map(({ symbol, quote }) => {
                    const change = quote.changePercent || 0;
                    const isPositive = change >= 0;
                    const volumePercent =
                        ((quote.volume || 0) / maxVolume) * 100;
                    const pricePercent = (quote.lastPrice / maxPrice) * 100;

                    // Generate mini sparkline data
                    const sparklineData = Array.from({ length: 10 }, (_, i) => {
                        const variance =
                            (Math.random() - 0.5) * (quote.lastPrice * 0.015);
                        return quote.lastPrice + variance;
                    });
                    sparklineData[9] = quote.lastPrice;

                    return (
                        <div
                            key={symbol}
                            className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3 hover:bg-[#1a1d24]/80 transition-all"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-sm text-[#e8eaed]">
                                                {symbol}
                                            </span>
                                            {isPositive ? (
                                                <ArrowUp className="h-3 w-3 text-[#3dd68c]" />
                                            ) : (
                                                <ArrowDown className="h-3 w-3 text-[#f06c6c]" />
                                            )}
                                        </div>
                                        <p className="text-lg font-bold font-mono text-[#e8eaed] mt-0.5">
                                            ₹
                                            {quote.lastPrice.toLocaleString(
                                                "en-IN",
                                                { maximumFractionDigits: 2 }
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                    <Badge
                                        variant={
                                            isPositive
                                                ? "default"
                                                : "destructive"
                                        }
                                        className="font-semibold text-xs py-0"
                                    >
                                        {isPositive ? "+" : ""}
                                        {Math.abs(change).toFixed(2)}%
                                    </Badge>
                                    <Sparkline
                                        data={sparklineData}
                                        width={50}
                                        height={16}
                                        color={
                                            isPositive
                                                ? "rgb(61, 214, 140)"
                                                : "rgb(240, 108, 108)"
                                        }
                                        showFill={false}
                                    />
                                </div>
                            </div>

                            {/* Visual Metrics */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[#8b8f9a] w-14">
                                        Price
                                    </span>
                                    <Progress
                                        value={pricePercent}
                                        className="flex-1 h-1"
                                        indicatorClassName="bg-[#6c8cff]"
                                    />
                                    <span className="text-[10px] font-medium text-[#e8eaed] w-12 text-right">
                                        {pricePercent.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[#8b8f9a] w-14">
                                        Volume
                                    </span>
                                    <Progress
                                        value={volumePercent}
                                        className="flex-1 h-1"
                                        indicatorClassName="bg-purple-500"
                                    />
                                    <span className="text-[10px] font-medium text-[#e8eaed] w-12 text-right">
                                        {(quote.volume || 0) > 1000000
                                            ? (
                                                  (quote.volume || 0) / 1000000
                                              ).toFixed(1) + "M"
                                            : (
                                                  (quote.volume || 0) / 1000
                                              ).toFixed(0) + "K"}
                                    </span>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#2d303a]/40">
                                <div>
                                    <p className="text-[10px] text-[#8b8f9a]">
                                        High
                                    </p>
                                    <p className="text-[10px] font-semibold text-[#e8eaed]">
                                        ₹{quote.dayHigh?.toFixed(2) || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#8b8f9a]">
                                        Low
                                    </p>
                                    <p className="text-[10px] font-semibold text-[#e8eaed]">
                                        ₹{quote.dayLow?.toFixed(2) || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#8b8f9a]">
                                        Prev
                                    </p>
                                    <p className="text-[10px] font-semibold text-[#e8eaed]">
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

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
                <div>
                    <p className="text-[10px] text-[#8b8f9a] flex items-center gap-1">
                        <Activity className="h-2.5 w-2.5" />
                        Avg Change
                    </p>
                    <p
                        className={`text-base font-bold font-mono ${
                            stocksWithQuotes.reduce(
                                (sum, s) => sum + (s.quote.changePercent || 0),
                                0
                            ) /
                                stocksWithQuotes.length >=
                            0
                                ? "text-[#3dd68c]"
                                : "text-[#f06c6c]"
                        }`}
                    >
                        {(
                            stocksWithQuotes.reduce(
                                (sum, s) => sum + (s.quote.changePercent || 0),
                                0
                            ) / stocksWithQuotes.length
                        ).toFixed(2)}
                        %
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b8f9a] flex items-center gap-1">
                        <BarChart3 className="h-2.5 w-2.5" />
                        Total Volume
                    </p>
                    <p className="text-base font-bold font-mono text-[#e8eaed]">
                        {(
                            stocksWithQuotes.reduce(
                                (sum, s) => sum + (s.quote.volume || 0),
                                0
                            ) / 1000000
                        ).toFixed(2)}
                        M
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b8f9a]">Stocks Tracked</p>
                    <p className="text-base font-bold font-mono text-[#e8eaed]">
                        {stocksWithQuotes.length}
                    </p>
                </div>
            </div>
        </div>
    );
}

