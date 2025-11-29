"use client";

import { useState, useCallback } from "react";
import type { BacktestResponse } from "@trader/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    TrendingUp,
    Target,
    DollarSign,
    BarChart3,
    Zap,
    Plus,
    X,
    Play,
    Calendar,
    ChevronDown,
    ArrowRightLeft,
} from "lucide-react";

import { BacktestResults } from "@/components/backtesting/backtest-results";
import { AgenticLoader } from "@/components/backtesting/agentic-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerminalLayout } from "@/components/layout/terminal-layout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const STOCK_SUGGESTIONS = ["^NSEI", "RELIANCE.NS", "TCS.NS", "INFY.NS"];

const ENTRY_SUGGESTIONS = [
    "Buy when RSI < 30 and price is above 200-day SMA",
    "Buy when price crosses above 50-day SMA with increasing volume",
    "Buy on golden cross (50 SMA above 200 SMA) with RSI between 40-60",
    "Buy when MACD crosses above signal line and RSI is below 50",
];

const EXIT_SUGGESTIONS = [
    "Sell when RSI > 70 or trailing stop loss at 8%",
    "Sell when price drops 5% below 20-day SMA or take profit at 15%",
    "Sell on death cross or stop loss at 10% below entry",
    "Sell when MACD crosses below signal line with trailing stop at 7%",
];

export function BacktestClient({
    initialResult,
}: {
    initialResult?: BacktestResponse | null;
}) {
    const [entryStrategy, setEntryStrategy] = useState("");
    const [exitStrategy, setExitStrategy] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [stocks, setStocks] = useState<string[]>(["^NSEI"]);
    const [capital, setCapital] = useState(50000);
    const [startDate, setStartDate] = useState("2020-01-01");
    const [endDate, setEndDate] = useState("2025-01-01");
    const [newSymbol, setNewSymbol] = useState("");
    const [result, setResult] = useState<BacktestResponse | null>(
        initialResult ?? null
    );
    const [showLoader, setShowLoader] = useState(false);
    const [isResultReady, setIsResultReady] = useState(false);
    const [pendingResult, setPendingResult] = useState<BacktestResponse | null>(
        null
    );

    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/backtest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryStrategy,
                    exitStrategy,
                    stocks,
                    capital,
                    startDate,
                    endDate,
                }),
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Backtest failed");
            }
            return response.json();
        },
        onSuccess: (payload: BacktestResponse) => {
            // Store the result but don't show it yet - wait for user to skip or loader to finish
            setPendingResult(payload);
            setIsResultReady(true);
        },
        onError: (error) => {
            setShowLoader(false);
            setIsResultReady(false);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to run backtest"
            );
        },
    });

    const handleViewResults = useCallback(() => {
        if (pendingResult) {
            setResult(pendingResult);
            setPendingResult(null);
            setShowLoader(false);
            setIsResultReady(false);
        }
    }, [pendingResult]);

    const handleSubmit = () => {
        if (!entryStrategy.trim() || !exitStrategy.trim() || mutation.isPending)
            return;
        // Reset states for new backtest
        setShowLoader(true);
        setIsResultReady(false);
        setPendingResult(null);
        mutation.mutate();
    };

    const addSymbol = () => {
        const symbol = newSymbol.trim().toUpperCase();
        if (symbol && !stocks.includes(symbol)) {
            setStocks([...stocks, symbol]);
            setNewSymbol("");
        }
    };

    const removeSymbol = (symbolToRemove: string) => {
        setStocks(stocks.filter((s) => s !== symbolToRemove));
    };

    const addSuggestedStock = (symbol: string) => {
        if (!stocks.includes(symbol)) {
            setStocks([...stocks, symbol]);
        }
    };

    return (
        <TerminalLayout
            title={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
                    <BarChart3 className="h-3.5 w-3.5 text-[#6c8cff]" />
                    <span className="text-xs text-[#8b8f9a]">Backtesting</span>
                </div>
            }
            centerContent={
                result ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
                            <TrendingUp className="h-4 w-4 text-[#6c8cff]" />
                            <span className="text-xs text-[#8b8f9a]">
                                Portfolio Return
                            </span>
                            <span
                                className={cn(
                                    "text-lg font-bold font-mono",
                                    (result.portfolio_metrics
                                        ?.portfolio_return_pct ?? 0) >= 0
                                        ? "text-[#3dd68c]"
                                        : "text-[#f06c6c]"
                                )}
                            >
                                {(result.portfolio_metrics
                                    ?.portfolio_return_pct ?? 0) > 0
                                    ? "+"
                                    : ""}
                                {(
                                    result.portfolio_metrics
                                        ?.portfolio_return_pct ?? 0
                                ).toFixed(2)}
                                %
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24]/60 border border-[#2d303a]/30">
                            <span className="text-xs text-[#8b8f9a]">
                                Win Rate
                            </span>
                            <span className="text-sm font-semibold text-[#e8eaed]">
                                {(
                                    result.portfolio_metrics
                                        ?.avg_win_rate_pct ?? 0
                                ).toFixed(1)}
                                %
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24]/60 border border-[#2d303a]/30">
                        <DollarSign className="h-3.5 w-3.5 text-[#8b8f9a]" />
                        <span className="text-xs text-[#8b8f9a]">Capital:</span>
                        <span className="text-sm font-medium text-[#e8eaed]">
                            ₹{capital.toLocaleString("en-IN")}
                        </span>
                        <Badge
                            variant="outline"
                            className="text-[10px] bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                        >
                            {stocks.length} stocks
                        </Badge>
                    </div>
                )
            }
        >
            <div className="flex-1 flex flex-col bg-[#0c0d10] overflow-hidden">
                {/* Agentic Loading State */}
                {showLoader && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="min-h-full flex items-center justify-center p-6">
                            <AgenticLoader
                                isLoading={showLoader}
                                isResultReady={isResultReady}
                                onViewResults={handleViewResults}
                                entryStrategy={entryStrategy}
                                exitStrategy={exitStrategy}
                                stocks={stocks}
                                capital={capital}
                            />
                        </div>
                    </div>
                )}

                {/* Centered Input Box */}
                {!result && !showLoader && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="min-h-full flex items-center justify-center p-6">
                            <div className="w-full max-w-xl my-auto">
                                <div className="rounded-2xl bg-[#12141a] border border-[#2d303a]/50 p-6 shadow-xl">
                                    {/* Header */}
                                    <div className="text-center mb-6">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#6c8cff]/10 border border-[#6c8cff]/20 mb-4">
                                            <BarChart3 className="h-6 w-6 text-[#6c8cff]" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-[#e8eaed] mb-2">
                                            Run Backtest
                                        </h2>
                                        <p className="text-sm text-[#8b8f9a]">
                                            Describe your entry and exit
                                            strategies in plain English
                                        </p>
                                    </div>

                                    {/* Strategy Inputs - Main Focus */}
                                    <div className="space-y-4 mb-6">
                                        {/* Entry Strategy */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#3dd68c]">
                                                <TrendingUp className="h-3.5 w-3.5" />
                                                Entry Strategy (When to Buy)
                                            </label>
                                            <textarea
                                                value={entryStrategy}
                                                onChange={(e) =>
                                                    setEntryStrategy(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g., Buy when RSI drops below 30 and price is above 200-day moving average"
                                                rows={3}
                                                className="w-full px-4 py-3 text-sm bg-[#1a1d24] border border-[#2d303a]/50 rounded-xl text-[#e8eaed] placeholder:text-[#8b8f9a] focus:border-[#3dd68c] focus:ring-1 focus:ring-[#3dd68c]/20 focus:outline-none resize-none transition-colors"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {ENTRY_SUGGESTIONS.map(
                                                    (suggestion, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() =>
                                                                setEntryStrategy(
                                                                    suggestion
                                                                )
                                                            }
                                                            className="px-2.5 py-1 text-[10px] text-[#8b8f9a] bg-[#1a1d24] border border-[#2d303a]/50 rounded-lg hover:border-[#3dd68c]/50 hover:text-[#3dd68c] transition-colors"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Visual Separator */}
                                        <div className="flex items-center gap-3 py-2">
                                            <div className="flex-1 h-px bg-[#2d303a]/50" />
                                            <ArrowRightLeft className="h-4 w-4 text-[#8b8f9a]" />
                                            <div className="flex-1 h-px bg-[#2d303a]/50" />
                                        </div>

                                        {/* Exit Strategy */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#f06c6c]">
                                                <TrendingUp className="h-3.5 w-3.5 rotate-180" />
                                                Exit Strategy (When to Sell)
                                            </label>
                                            <textarea
                                                value={exitStrategy}
                                                onChange={(e) =>
                                                    setExitStrategy(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g., Sell when RSI rises above 70 or stop loss at 5% below entry price"
                                                rows={3}
                                                className="w-full px-4 py-3 text-sm bg-[#1a1d24] border border-[#2d303a]/50 rounded-xl text-[#e8eaed] placeholder:text-[#8b8f9a] focus:border-[#f06c6c] focus:ring-1 focus:ring-[#f06c6c]/20 focus:outline-none resize-none transition-colors"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {EXIT_SUGGESTIONS.map(
                                                    (suggestion, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() =>
                                                                setExitStrategy(
                                                                    suggestion
                                                                )
                                                            }
                                                            className="px-2.5 py-1 text-[10px] text-[#8b8f9a] bg-[#1a1d24] border border-[#2d303a]/50 rounded-lg hover:border-[#f06c6c]/50 hover:text-[#f06c6c] transition-colors"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Options Toggle */}
                                    <button
                                        onClick={() =>
                                            setShowAdvanced(!showAdvanced)
                                        }
                                        className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs text-[#8b8f9a] hover:text-[#e8eaed] transition-colors"
                                    >
                                        <span>Advanced Options</span>
                                        <ChevronDown
                                            className={cn(
                                                "h-3.5 w-3.5 transition-transform",
                                                showAdvanced && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {/* Advanced Options */}
                                    {showAdvanced && (
                                        <div className="space-y-4 mb-6 p-4 rounded-xl bg-[#0c0d10] border border-[#2d303a]/30">
                                            {/* Date Range */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a]">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        Start Date
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) =>
                                                            setStartDate(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a]">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        End Date
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) =>
                                                            setEndDate(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                                    />
                                                </div>
                                            </div>

                                            {/* Capital Input */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a]">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    Initial Capital
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={capital}
                                                    onChange={(e) =>
                                                        setCapital(
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                                    placeholder="Enter initial capital"
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    {[
                                                        10000, 50000, 100000,
                                                        500000,
                                                    ].map((amt) => (
                                                        <button
                                                            key={amt}
                                                            onClick={() =>
                                                                setCapital(amt)
                                                            }
                                                            className={cn(
                                                                "flex-1 py-1.5 text-xs rounded-lg border transition-colors",
                                                                capital === amt
                                                                    ? "bg-[#6c8cff] border-[#6c8cff] text-white"
                                                                    : "bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a] hover:border-[#6c8cff]/50 hover:text-[#e8eaed]"
                                                            )}
                                                        >
                                                            ₹
                                                            {amt >= 100000
                                                                ? `${
                                                                      amt /
                                                                      100000
                                                                  }L`
                                                                : `${
                                                                      amt / 1000
                                                                  }K`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Stock Selection */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a]">
                                                    <Target className="h-3.5 w-3.5" />
                                                    Stocks to Backtest
                                                </label>

                                                {/* Selected Stocks */}
                                                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-[#1a1d24] border border-[#2d303a]/50 min-h-[44px]">
                                                    {stocks.length === 0 ? (
                                                        <span className="text-xs text-[#8b8f9a]">
                                                            No stocks selected
                                                        </span>
                                                    ) : (
                                                        stocks.map((symbol) => (
                                                            <button
                                                                key={symbol}
                                                                onClick={() =>
                                                                    removeSymbol(
                                                                        symbol
                                                                    )
                                                                }
                                                                className="group flex items-center gap-1.5 px-2.5 py-1 bg-[#0c0d10] border border-[#2d303a]/50 rounded-lg hover:border-[#f06c6c] transition-all duration-200"
                                                            >
                                                                <span className="text-xs text-[#e8eaed]">
                                                                    {symbol}
                                                                </span>
                                                                <X className="h-3 w-3 text-[#8b8f9a] group-hover:text-[#f06c6c]" />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Add Stock Input */}
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Add stock symbol (e.g., RELIANCE.NS)"
                                                        value={newSymbol}
                                                        onChange={(e) =>
                                                            setNewSymbol(
                                                                e.target.value.toUpperCase()
                                                            )
                                                        }
                                                        onKeyDown={(e) =>
                                                            e.key === "Enter" &&
                                                            addSymbol()
                                                        }
                                                        className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] placeholder:text-[#8b8f9a] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                                    />
                                                    <Button
                                                        onClick={addSymbol}
                                                        size="sm"
                                                        className="h-10 px-4 bg-[#6c8cff] hover:bg-[#5c7ce8]"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Stock Suggestions */}
                                                <div className="flex flex-wrap gap-2">
                                                    {STOCK_SUGGESTIONS.filter(
                                                        (s) =>
                                                            !stocks.includes(s)
                                                    ).map((symbol) => (
                                                        <button
                                                            key={symbol}
                                                            onClick={() =>
                                                                addSuggestedStock(
                                                                    symbol
                                                                )
                                                            }
                                                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#8b8f9a] bg-[#1a1d24] border border-[#2d303a]/50 rounded-lg hover:border-[#6c8cff]/50 hover:text-[#e8eaed] transition-colors"
                                                        >
                                                            <Zap className="h-3 w-3 text-[#6c8cff]" />
                                                            {symbol}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={
                                            !entryStrategy.trim() ||
                                            !exitStrategy.trim() ||
                                            mutation.isPending
                                        }
                                        className="w-full h-12 text-sm font-medium bg-[#6c8cff] hover:bg-[#5c7ce8] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Play className="h-4 w-4" />
                                            <span>Run Backtest</span>
                                        </div>
                                    </Button>

                                    <p className="text-[10px] text-center text-[#8b8f9a] mt-4">
                                        Backtesting uses historical data. Past
                                        performance does not guarantee future
                                        results.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Area */}
                {result && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-6xl mx-auto px-6 py-6">
                            {/* Run New Backtest Button */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Badge
                                            variant="outline"
                                            className="bg-[#3dd68c]/10 border-[#3dd68c]/30 text-[#3dd68c]"
                                        >
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Entry:{" "}
                                            {entryStrategy.length > 30
                                                ? entryStrategy.slice(0, 30) +
                                                  "..."
                                                : entryStrategy}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="bg-[#f06c6c]/10 border-[#f06c6c]/30 text-[#f06c6c]"
                                        >
                                            <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                                            Exit:{" "}
                                            {exitStrategy.length > 30
                                                ? exitStrategy.slice(0, 30) +
                                                  "..."
                                                : exitStrategy}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant="outline"
                                            className="bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                                        >
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {startDate} → {endDate}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                                        >
                                            <Target className="h-3 w-3 mr-1" />
                                            {stocks.length} stocks
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                                        >
                                            <DollarSign className="h-3 w-3 mr-1" />
                                            ₹{capital.toLocaleString("en-IN")}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setResult(null)}
                                    variant="outline"
                                    className="h-9 px-4 text-xs bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] hover:bg-[#252730] hover:border-[#6c8cff]/50"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-2" />
                                    New Backtest
                                </Button>
                            </div>

                            <BacktestResults
                                result={result}
                                capital={capital}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(139, 143, 154, 0.2);
                    border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(139, 143, 154, 0.35);
                }
                .custom-scrollbar::-webkit-scrollbar-corner {
                    background: transparent;
                }
                @keyframes bounce {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-4px);
                    }
                }
            `}</style>
        </TerminalLayout>
    );
}

