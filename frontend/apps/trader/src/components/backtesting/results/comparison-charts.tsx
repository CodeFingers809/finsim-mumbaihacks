"use client";

import type { TradeMetrics } from "@trader/types";
import { BarChart2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface ComparisonChartsProps {
    results: TradeMetrics[];
}

export function ComparisonCharts({ results }: ComparisonChartsProps) {
    if (!results || results.length === 0) return null;

    // Sort by P&L for the bar chart
    const sortedByPnl = [...results].sort((a, b) => b.pnl - a.pnl);
    const maxAbsPnl = Math.max(...results.map((r) => Math.abs(r.pnl)));

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* P&L by Symbol */}
            <Card className="bg-[#12141a] border-[#2d303a]/50">
                <CardHeader className="border-b border-[#2d303a]/40">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-[#f06c6c]" />
                        <CardTitle className="text-[#e8eaed] text-base">
                            P&L by Symbol
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        {sortedByPnl.map((ticker) => {
                            const width =
                                (Math.abs(ticker.pnl) / maxAbsPnl) * 100;
                            const isPositive = ticker.pnl >= 0;

                            return (
                                <div key={ticker.symbol} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#e8eaed] font-medium">
                                            {ticker.symbol.replace(".NS", "")}
                                        </span>
                                        <span
                                            className={cn(
                                                "font-mono font-semibold",
                                                isPositive
                                                    ? "text-[#3dd68c]"
                                                    : "text-[#f06c6c]"
                                            )}
                                        >
                                            {ticker.pnl > 0 ? "+" : ""}₹
                                            {Math.abs(
                                                ticker.pnl
                                            ).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                isPositive
                                                    ? "bg-gradient-to-r from-[#3dd68c] to-[#3dd68c]/60"
                                                    : "bg-gradient-to-r from-[#f06c6c] to-[#f06c6c]/60"
                                            )}
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Strategy vs Buy & Hold */}
            <Card className="bg-[#12141a] border-[#2d303a]/50">
                <CardHeader className="border-b border-[#2d303a]/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-[#6c8cff]" />
                            <CardTitle className="text-[#e8eaed] text-base">
                                Strategy vs Buy & Hold
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-4 text-[10px]">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#6c8cff]" />
                                <span className="text-[#8b8f9a]">Strategy</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                                <span className="text-[#8b8f9a]">
                                    Buy & Hold
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {results.map((ticker) => {
                            const maxReturn = Math.max(
                                Math.abs(ticker.strategy_return_pct),
                                Math.abs(ticker.buy_hold_return_pct),
                                1
                            );
                            const strategyWidth =
                                (Math.abs(ticker.strategy_return_pct) /
                                    maxReturn) *
                                50;
                            const buyHoldWidth =
                                (Math.abs(ticker.buy_hold_return_pct) /
                                    maxReturn) *
                                50;

                            return (
                                <div key={ticker.symbol} className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#e8eaed] font-medium">
                                            {ticker.symbol.replace(".NS", "")}
                                        </span>
                                        <div className="flex items-center gap-3 text-[10px]">
                                            <span
                                                className={cn(
                                                    "font-mono",
                                                    ticker.strategy_return_pct >=
                                                        0
                                                        ? "text-[#3dd68c]"
                                                        : "text-[#f06c6c]"
                                                )}
                                            >
                                                {ticker.strategy_return_pct > 0
                                                    ? "+"
                                                    : ""}
                                                {ticker.strategy_return_pct.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>
                                            <span className="text-[#8b8f9a]">
                                                vs
                                            </span>
                                            <span
                                                className={cn(
                                                    "font-mono",
                                                    ticker.buy_hold_return_pct >=
                                                        0
                                                        ? "text-[#3dd68c]"
                                                        : "text-[#f06c6c]"
                                                )}
                                            >
                                                {ticker.buy_hold_return_pct > 0
                                                    ? "+"
                                                    : ""}
                                                {ticker.buy_hold_return_pct.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="flex-1 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#6c8cff] rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${strategyWidth}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${buyHoldWidth}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

