"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import {
    TrendingUp,
    TrendingDown,
    Target,
    Activity,
    BarChart3,
    Calendar,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface PerformanceAnalyticsProps {
    quotes: Record<string, MarketQuote>;
    watchlist?: Watchlist;
    isLoading: boolean;
}

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "1Y";

// Mock historical performance calculation
function calculateReturns(currentPrice: number, period: TimePeriod): number {
    const volatility: Record<TimePeriod, number> = {
        "1D": 0.02,
        "1W": 0.05,
        "1M": 0.1,
        "3M": 0.2,
        "1Y": 0.35,
    };

    const baseReturn = (Math.random() - 0.5) * volatility[period] * 100;
    return baseReturn;
}

// Calculate risk metrics
function calculateRiskMetrics(
    returns: Record<TimePeriod, number>,
    price: number
) {
    const yearlyReturn = returns["1Y"];

    // Sharpe Ratio (simplified: (return - risk-free rate) / volatility)
    const riskFreeRate = 6.5; // Assume 6.5% risk-free rate
    const volatility = 15 + Math.random() * 10; // Mock volatility
    const sharpeRatio = (yearlyReturn - riskFreeRate) / volatility;

    // Max Drawdown (mock)
    const maxDrawdown = -(Math.random() * 15 + 5); // -5% to -20%

    // Beta (vs NIFTY 50)
    const beta = 0.8 + Math.random() * 0.6; // 0.8 to 1.4

    // 52-week high/low
    const weekHigh52 = price * (1 + Math.random() * 0.2);
    const weekLow52 = price * (1 - Math.random() * 0.15);
    const distanceFromHigh = ((price - weekHigh52) / weekHigh52) * 100;
    const distanceFromLow = ((price - weekLow52) / weekLow52) * 100;

    return {
        sharpeRatio,
        maxDrawdown,
        beta,
        volatility,
        weekHigh52,
        weekLow52,
        distanceFromHigh,
        distanceFromLow,
    };
}

export function PerformanceAnalytics({
    quotes,
    watchlist,
    isLoading,
}: PerformanceAnalyticsProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");

    if (!watchlist || watchlist.stocks.length === 0) {
        return (
            <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Performance Analytics
                    </h3>
                </div>
                <p className="text-sm text-[#8b8f9a]">
                    Add stocks to your watchlist to see performance analytics
                </p>
            </div>
        );
    }

    const stocksWithPerformance = watchlist.stocks
        .map((stock) => {
            const quote = quotes[stock.symbol];
            if (!quote || typeof quote.lastPrice !== "number") return null;

            const returns: Record<TimePeriod, number> = {
                "1D": calculateReturns(quote.lastPrice, "1D"),
                "1W": calculateReturns(quote.lastPrice, "1W"),
                "1M": calculateReturns(quote.lastPrice, "1M"),
                "3M": calculateReturns(quote.lastPrice, "3M"),
                "1Y": calculateReturns(quote.lastPrice, "1Y"),
            };

            return {
                symbol: stock.symbol,
                quote,
                returns,
                currentReturn: returns[selectedPeriod],
                riskMetrics: calculateRiskMetrics(returns, quote.lastPrice),
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.currentReturn - a.currentReturn);

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Performance Analytics
                    </h3>
                </div>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-32 rounded-xl bg-[#1a1d24] animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (stocksWithPerformance.length === 0) {
        return (
            <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Performance Analytics
                    </h3>
                </div>
                <p className="text-sm text-[#8b8f9a]">
                    Loading performance data...
                </p>
            </div>
        );
    }

    const avgReturn =
        stocksWithPerformance.reduce((sum, s) => sum + s.currentReturn, 0) /
        stocksWithPerformance.length;
    const avgSharpe =
        stocksWithPerformance.reduce(
            (sum, s) => sum + s.riskMetrics.sharpeRatio,
            0
        ) / stocksWithPerformance.length;
    const avgBeta =
        stocksWithPerformance.reduce((sum, s) => sum + s.riskMetrics.beta, 0) /
        stocksWithPerformance.length;
    const bestPerformer = stocksWithPerformance[0];
    const worstPerformer =
        stocksWithPerformance[stocksWithPerformance.length - 1];

    // Mock NIFTY 50 comparison
    const niftyReturn = avgReturn * (0.9 + Math.random() * 0.2);

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                        Performance Analytics
                    </h3>
                </div>
                <Calendar className="h-3.5 w-3.5 text-[#8b8f9a]" />
            </div>

            {/* Time Period Selector */}
            <div className="flex gap-1">
                {(["1D", "1W", "1M", "3M", "1Y"] as TimePeriod[]).map(
                    (period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={cn(
                                "flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                                selectedPeriod === period
                                    ? "bg-[#6c8cff]/20 text-[#6c8cff]"
                                    : "bg-[#2d303a]/30 text-[#8b8f9a] hover:bg-[#2d303a]/50"
                            )}
                        >
                            {period}
                        </button>
                    )
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#3dd68c]/20 bg-gradient-to-br from-[#3dd68c]/10 to-[#3dd68c]/5 p-3">
                    <p className="text-[10px] text-[#8b8f9a] mb-0.5">
                        Avg Return ({selectedPeriod})
                    </p>
                    <p
                        className={cn(
                            "text-xl font-bold font-mono",
                            avgReturn >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
                        )}
                    >
                        {avgReturn >= 0 ? "+" : ""}
                        {avgReturn.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-[#8b8f9a] mt-0.5">
                        Portfolio
                    </p>
                </div>

                <div className="rounded-xl border border-[#6c8cff]/20 bg-gradient-to-br from-[#6c8cff]/10 to-[#6c8cff]/5 p-3">
                    <p className="text-[10px] text-[#8b8f9a] mb-0.5">
                        vs NIFTY 50
                    </p>
                    <p
                        className={cn(
                            "text-xl font-bold font-mono",
                            avgReturn > niftyReturn
                                ? "text-[#3dd68c]"
                                : "text-[#f06c6c]"
                        )}
                    >
                        {avgReturn > niftyReturn ? "+" : ""}
                        {(avgReturn - niftyReturn).toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-[#8b8f9a] mt-0.5">
                        NIFTY: {niftyReturn >= 0 ? "+" : ""}
                        {niftyReturn.toFixed(2)}%
                    </p>
                </div>
            </div>

            {/* Risk Metrics */}
            <div className="grid grid-cols-4 gap-2">
                <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-2 text-center">
                    <Activity className="h-3 w-3 mx-auto mb-1 text-[#8b8f9a]" />
                    <p className="text-[9px] text-[#8b8f9a]">Avg Sharpe</p>
                    <p
                        className={cn(
                            "text-sm font-bold font-mono",
                            avgSharpe > 1
                                ? "text-[#3dd68c]"
                                : avgSharpe > 0
                                ? "text-[#e8eaed]"
                                : "text-[#f06c6c]"
                        )}
                    >
                        {avgSharpe.toFixed(2)}
                    </p>
                    <div className="mt-1 h-0.5 rounded-full bg-[#2d303a]/50 overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full",
                                avgSharpe > 1 ? "bg-[#3dd68c]" : "bg-yellow-500"
                            )}
                            style={{
                                width: `${Math.min(
                                    100,
                                    (avgSharpe + 1) * 33.3
                                )}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-2 text-center">
                    <Target className="h-3 w-3 mx-auto mb-1 text-[#8b8f9a]" />
                    <p className="text-[9px] text-[#8b8f9a]">Avg Beta</p>
                    <p className="text-sm font-bold font-mono text-[#e8eaed]">
                        {avgBeta.toFixed(2)}
                    </p>
                    <div className="mt-1 h-0.5 rounded-full bg-[#2d303a]/50 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#6c8cff]"
                            style={{
                                width: `${Math.min(100, (avgBeta / 2) * 100)}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-[#3dd68c]/30 bg-gradient-to-br from-[#3dd68c]/15 to-[#3dd68c]/5 p-2">
                    <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[9px] text-[#8b8f9a]">Best</p>
                        <TrendingUp className="h-2.5 w-2.5 text-[#3dd68c]" />
                    </div>
                    <p className="text-[10px] font-bold text-[#e8eaed]">
                        {bestPerformer.symbol}
                    </p>
                    <p className="text-sm font-bold font-mono text-[#3dd68c]">
                        +{bestPerformer.currentReturn.toFixed(1)}%
                    </p>
                </div>

                <div className="rounded-xl border border-[#f06c6c]/30 bg-gradient-to-br from-[#f06c6c]/15 to-[#f06c6c]/5 p-2">
                    <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[9px] text-[#8b8f9a]">Worst</p>
                        <TrendingDown className="h-2.5 w-2.5 text-[#f06c6c]" />
                    </div>
                    <p className="text-[10px] font-bold text-[#e8eaed]">
                        {worstPerformer.symbol}
                    </p>
                    <p className="text-sm font-bold font-mono text-[#f06c6c]">
                        {worstPerformer.currentReturn.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Stock Performance List */}
            <div className="space-y-2">
                <h4 className="text-[10px] font-medium text-[#8b8f9a] uppercase tracking-wide flex items-center gap-1">
                    <BarChart3 className="h-2.5 w-2.5" />
                    Stock Returns ({selectedPeriod})
                </h4>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {stocksWithPerformance.map((stock) => {
                        const isPositive = stock.currentReturn >= 0;
                        const barWidth = Math.min(
                            Math.abs(stock.currentReturn) * 2.5,
                            100
                        );
                        const rangePosition =
                            ((stock.quote.lastPrice -
                                stock.riskMetrics.weekLow52) /
                                (stock.riskMetrics.weekHigh52 -
                                    stock.riskMetrics.weekLow52)) *
                            100;

                        return (
                            <div
                                key={stock.symbol}
                                className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3 hover:border-[#2d303a]/60 transition-colors"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="text-xs font-medium text-[#e8eaed]">
                                            {stock.symbol}
                                        </span>
                                        <p className="text-[10px] text-[#8b8f9a] font-mono">
                                            ₹
                                            {stock.quote.lastPrice.toLocaleString(
                                                "en-IN",
                                                { maximumFractionDigits: 2 }
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isPositive ? (
                                            <TrendingUp className="h-3 w-3 text-[#3dd68c]" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3 text-[#f06c6c]" />
                                        )}
                                        <span
                                            className={cn(
                                                "text-sm font-bold font-mono",
                                                isPositive
                                                    ? "text-[#3dd68c]"
                                                    : "text-[#f06c6c]"
                                            )}
                                        >
                                            {isPositive ? "+" : ""}
                                            {stock.currentReturn.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Performance Bar */}
                                <div className="mb-2">
                                    <div className="h-1.5 rounded-full bg-[#2d303a]/50 overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                isPositive
                                                    ? "bg-gradient-to-r from-[#3dd68c]/80 to-[#3dd68c]"
                                                    : "bg-gradient-to-r from-[#f06c6c]/80 to-[#f06c6c]"
                                            )}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>

                                {/* All Period Returns */}
                                <div className="flex gap-1 mb-2">
                                    {(
                                        [
                                            "1D",
                                            "1W",
                                            "1M",
                                            "3M",
                                            "1Y",
                                        ] as TimePeriod[]
                                    ).map((period) => {
                                        const ret = stock.returns[period];
                                        const isSelected =
                                            period === selectedPeriod;
                                        return (
                                            <div
                                                key={period}
                                                className={cn(
                                                    "flex-1 rounded-lg px-1 py-1 text-center transition-all",
                                                    isSelected
                                                        ? "bg-[#6c8cff]/20 border border-[#6c8cff]/40"
                                                        : "bg-[#2d303a]/30"
                                                )}
                                            >
                                                <p className="text-[8px] text-[#8b8f9a]">
                                                    {period}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "text-[9px] font-bold font-mono",
                                                        ret >= 0
                                                            ? "text-[#3dd68c]"
                                                            : "text-[#f06c6c]"
                                                    )}
                                                >
                                                    {ret >= 0 ? "+" : ""}
                                                    {ret.toFixed(1)}%
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Risk Metrics */}
                                <div className="grid grid-cols-4 gap-1.5 mb-2">
                                    <div className="rounded-lg bg-[#2d303a]/30 p-1.5">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[9px] text-[#8b8f9a]">
                                                Sharpe
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold font-mono",
                                                    stock.riskMetrics
                                                        .sharpeRatio > 1
                                                        ? "text-[#3dd68c]"
                                                        : "text-[#e8eaed]"
                                                )}
                                            >
                                                {stock.riskMetrics.sharpeRatio.toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>
                                        <div className="h-0.5 rounded-full bg-[#2d303a]/50 overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    stock.riskMetrics
                                                        .sharpeRatio > 1
                                                        ? "bg-[#3dd68c]"
                                                        : "bg-yellow-500"
                                                )}
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (stock.riskMetrics
                                                            .sharpeRatio +
                                                            1) *
                                                            33.3
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-[#2d303a]/30 p-1.5">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[9px] text-[#8b8f9a]">
                                                Beta
                                            </span>
                                            <span className="text-[10px] font-bold font-mono text-[#e8eaed]">
                                                {stock.riskMetrics.beta.toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>
                                        <div className="h-0.5 rounded-full bg-[#2d303a]/50 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[#6c8cff]"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (stock.riskMetrics
                                                            .beta /
                                                            2) *
                                                            100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-[#2d303a]/30 p-1.5">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[9px] text-[#8b8f9a]">
                                                Drawdown
                                            </span>
                                            <span className="text-[10px] font-bold font-mono text-[#f06c6c]">
                                                {stock.riskMetrics.maxDrawdown.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>
                                        </div>
                                        <div className="h-0.5 rounded-full bg-[#2d303a]/50 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[#f06c6c]"
                                                style={{
                                                    width: `${
                                                        Math.abs(
                                                            stock.riskMetrics
                                                                .maxDrawdown
                                                        ) * 5
                                                    }%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-[#2d303a]/30 p-1.5">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[9px] text-[#8b8f9a]">
                                                Volatility
                                            </span>
                                            <span className="text-[10px] font-bold font-mono text-[#e8eaed]">
                                                {stock.riskMetrics.volatility.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>
                                        </div>
                                        <div className="h-0.5 rounded-full bg-[#2d303a]/50 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-purple-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (stock.riskMetrics
                                                            .volatility /
                                                            35) *
                                                            100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 52-Week Range */}
                                <div className="rounded-lg bg-gradient-to-r from-[#6c8cff]/10 to-purple-500/10 p-2 border border-[#2d303a]/30">
                                    <p className="text-[9px] font-medium text-[#8b8f9a] mb-1">
                                        52-Week Range
                                    </p>
                                    <div className="flex justify-between text-[9px] mb-1">
                                        <span className="text-[#8b8f9a] font-mono">
                                            L: ₹
                                            {stock.riskMetrics.weekLow52.toFixed(
                                                2
                                            )}
                                        </span>
                                        <span className="font-bold text-[#e8eaed] font-mono">
                                            ₹{stock.quote.lastPrice.toFixed(2)}
                                        </span>
                                        <span className="text-[#8b8f9a] font-mono">
                                            H: ₹
                                            {stock.riskMetrics.weekHigh52.toFixed(
                                                2
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[#2d303a]/50 relative overflow-hidden">
                                        <div
                                            className="absolute h-full bg-gradient-to-r from-[#6c8cff] to-purple-500"
                                            style={{
                                                width: `${rangePosition}%`,
                                            }}
                                        />
                                        <div
                                            className="absolute h-2.5 w-0.5 bg-[#e8eaed] rounded-full -top-0.5"
                                            style={{
                                                left: `${rangePosition}%`,
                                                transform: "translateX(-50%)",
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[8px] text-[#8b8f9a] mt-0.5">
                                        <span>
                                            {stock.riskMetrics.distanceFromLow.toFixed(
                                                1
                                            )}
                                            % from low
                                        </span>
                                        <span>
                                            {stock.riskMetrics.distanceFromHigh.toFixed(
                                                1
                                            )}
                                            % from high
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

