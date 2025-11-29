"use client";

import type { TradeMetrics } from "@trader/types";
import {
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    XCircle,
    ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

interface TickerResultsProps {
    results: TradeMetrics[];
}

export function TickerResults({ results }: TickerResultsProps) {
    const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

    return (
        <Card className="bg-[#12141a] border-[#2d303a]/50">
            <CardHeader className="border-b border-[#2d303a]/40">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#6c8cff]" />
                    <CardTitle className="text-[#e8eaed] text-base">
                        Performance by Ticker
                    </CardTitle>
                    <Badge
                        variant="outline"
                        className="ml-auto bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                    >
                        {results.length} stocks
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-[#2d303a]/30">
                    {results.map((ticker) => (
                        <TickerRow
                            key={ticker.symbol}
                            ticker={ticker}
                            isExpanded={expandedTicker === ticker.symbol}
                            onToggle={() =>
                                setExpandedTicker(
                                    expandedTicker === ticker.symbol
                                        ? null
                                        : ticker.symbol
                                )
                            }
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function TickerRow({
    ticker,
    isExpanded,
    onToggle,
}: {
    ticker: TradeMetrics;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const isPositive = ticker.pnl >= 0;

    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#1a1d24]/50 transition-colors text-left"
            >
                {/* Status Icon */}
                <div
                    className={cn(
                        "p-2 rounded-lg",
                        isPositive ? "bg-[#3dd68c]/10" : "bg-[#f06c6c]/10"
                    )}
                >
                    {isPositive ? (
                        <CheckCircle2 className="h-4 w-4 text-[#3dd68c]" />
                    ) : (
                        <XCircle className="h-4 w-4 text-[#f06c6c]" />
                    )}
                </div>

                {/* Symbol */}
                <div className="min-w-[120px]">
                    <p className="text-sm font-semibold text-[#e8eaed]">
                        {ticker.symbol.replace(".NS", "")}
                    </p>
                    <p className="text-xs text-[#8b8f9a]">
                        {ticker.num_trades} trades
                    </p>
                </div>

                {/* Strategy Return */}
                <div className="min-w-[100px]">
                    <p className="text-xs text-[#8b8f9a]">Strategy</p>
                    <p
                        className={cn(
                            "text-sm font-semibold font-mono",
                            ticker.strategy_return_pct >= 0
                                ? "text-[#3dd68c]"
                                : "text-[#f06c6c]"
                        )}
                    >
                        {ticker.strategy_return_pct > 0 ? "+" : ""}
                        {ticker.strategy_return_pct.toFixed(2)}%
                    </p>
                </div>

                {/* Buy & Hold Return */}
                <div className="min-w-[100px]">
                    <p className="text-xs text-[#8b8f9a]">Buy & Hold</p>
                    <p
                        className={cn(
                            "text-sm font-semibold font-mono",
                            ticker.buy_hold_return_pct >= 0
                                ? "text-[#3dd68c]"
                                : "text-[#f06c6c]"
                        )}
                    >
                        {ticker.buy_hold_return_pct > 0 ? "+" : ""}
                        {ticker.buy_hold_return_pct.toFixed(2)}%
                    </p>
                </div>

                {/* Alpha */}
                <div className="min-w-[80px]">
                    <p className="text-xs text-[#8b8f9a]">Alpha</p>
                    <p
                        className={cn(
                            "text-sm font-semibold font-mono",
                            ticker.alpha_pct >= 0
                                ? "text-[#3dd68c]"
                                : "text-[#f06c6c]"
                        )}
                    >
                        {ticker.alpha_pct > 0 ? "+" : ""}
                        {ticker.alpha_pct.toFixed(2)}%
                    </p>
                </div>

                {/* P&L */}
                <div className="min-w-[100px] ml-auto text-right">
                    <p className="text-xs text-[#8b8f9a]">P&L</p>
                    <p
                        className={cn(
                            "text-sm font-bold font-mono",
                            ticker.pnl >= 0
                                ? "text-[#3dd68c]"
                                : "text-[#f06c6c]"
                        )}
                    >
                        {ticker.pnl > 0 ? "+" : ""}₹
                        {Math.abs(ticker.pnl).toLocaleString("en-IN")}
                    </p>
                </div>

                {/* Expand Icon */}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-[#8b8f9a] transition-transform duration-200",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>

            {/* Expanded Details */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0c0d10]/50">
                    <DetailItem
                        label="Sharpe Ratio"
                        value={ticker.sharpe_ratio.toFixed(3)}
                        isPositive={ticker.sharpe_ratio >= 0}
                    />
                    <DetailItem
                        label="Win Rate"
                        value={`${ticker.win_rate_pct.toFixed(1)}%`}
                        isPositive={ticker.win_rate_pct >= 50}
                    />
                    <DetailItem
                        label="Max Drawdown"
                        value={`${ticker.max_drawdown_pct.toFixed(2)}%`}
                        isPositive={false}
                    />
                    <DetailItem
                        label="Profit Factor"
                        value={ticker.profit_factor.toFixed(3)}
                        isPositive={ticker.profit_factor >= 1}
                    />
                </div>
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
    isPositive,
}: {
    label: string;
    value: string;
    isPositive: boolean;
}) {
    return (
        <div className="p-3 rounded-lg bg-[#1a1d24] border border-[#2d303a]/30">
            <p className="text-[10px] text-[#8b8f9a] uppercase tracking-wide mb-1">
                {label}
            </p>
            <p
                className={cn(
                    "text-sm font-semibold font-mono",
                    isPositive ? "text-[#3dd68c]" : "text-[#f06c6c]"
                )}
            >
                {value}
            </p>
        </div>
    );
}

