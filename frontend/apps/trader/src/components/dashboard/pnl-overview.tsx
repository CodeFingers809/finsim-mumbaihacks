"use client";

import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

interface PnLData {
    realizedPnL: number;
    unrealizedPnL: number;
    dailyMTM: number;
    winRate: number;
    totalTrades: number;
}

interface PnLOverviewProps {
    data?: PnLData;
}

export function PnLOverview({ data }: PnLOverviewProps) {
    // Mock data for demonstration
    const pnlData: PnLData = data || {
        realizedPnL: 12450.5,
        unrealizedPnL: -2300.25,
        dailyMTM: 1250.75,
        winRate: 68.5,
        totalTrades: 147,
    };

    const totalPnL = pnlData.realizedPnL + pnlData.unrealizedPnL;
    const isPositive = totalPnL >= 0;

    return (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-4">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">P&L Overview</h3>
                <div className="flex gap-1 text-[10px] text-gray-500">
                    <button className="rounded bg-[#1a1a1a] px-2 py-1 text-white">
                        All Time
                    </button>
                    <button className="rounded px-2 py-1 hover:bg-[#1a1a1a]">
                        Weekly
                    </button>
                    <button className="rounded px-2 py-1 hover:bg-[#1a1a1a]">
                        Daily
                    </button>
                </div>
            </div>

            {/* Total P&L */}
            <div className="mb-4 rounded-lg bg-black/40 p-3">
                <div className="mb-1 text-[11px] text-gray-500">Total P&L</div>
                <div className="flex items-baseline gap-2">
                    <span
                        className={`text-2xl font-semibold ${
                            isPositive ? "text-[#4ade80]" : "text-[#f87171]"
                        }`}
                    >
                        ₹
                        {Math.abs(totalPnL).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                    <span
                        className={`flex items-center gap-1 text-xs ${
                            isPositive ? "text-[#4ade80]" : "text-[#f87171]"
                        }`}
                    >
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs((totalPnL / 100000) * 100).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Realized P&L */}
                <div className="rounded bg-black/30 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-gray-500">
                        <DollarSign className="h-3 w-3" />
                        Realized
                    </div>
                    <div
                        className={`text-sm font-semibold ${
                            pnlData.realizedPnL >= 0
                                ? "text-[#4ade80]"
                                : "text-[#f87171]"
                        }`}
                    >
                        ₹{pnlData.realizedPnL.toLocaleString("en-IN")}
                    </div>
                </div>

                {/* Unrealized P&L */}
                <div className="rounded bg-black/30 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        Unrealized
                    </div>
                    <div
                        className={`text-sm font-semibold ${
                            pnlData.unrealizedPnL >= 0
                                ? "text-[#4ade80]"
                                : "text-[#f87171]"
                        }`}
                    >
                        ₹{pnlData.unrealizedPnL.toLocaleString("en-IN")}
                    </div>
                </div>

                {/* Daily MTM */}
                <div className="rounded bg-black/30 p-2.5">
                    <div className="mb-1 text-[10px] text-gray-500">
                        Today's MTM
                    </div>
                    <div
                        className={`text-sm font-semibold ${
                            pnlData.dailyMTM >= 0
                                ? "text-[#4ade80]"
                                : "text-[#f87171]"
                        }`}
                    >
                        ₹{pnlData.dailyMTM.toLocaleString("en-IN")}
                    </div>
                </div>

                {/* Win Rate */}
                <div className="rounded bg-black/30 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-gray-500">
                        <Target className="h-3 w-3" />
                        Win Rate
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-white">
                            {pnlData.winRate}%
                        </span>
                        <span className="text-[10px] text-gray-500">
                            ({pnlData.totalTrades})
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

