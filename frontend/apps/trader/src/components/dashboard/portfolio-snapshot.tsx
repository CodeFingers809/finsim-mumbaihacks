"use client";

import { PieChart, TrendingUp, Shield, Wallet } from "lucide-react";

interface PortfolioData {
    totalValue: number;
    investedCapital: number;
    freeCapital: number;
    returnPercent: number;
    holdings: number;
    riskScore: number;
}

export function PortfolioSnapshot() {
    // Mock portfolio data
    const portfolio: PortfolioData = {
        totalValue: 125340,
        investedCapital: 110000,
        freeCapital: 50000,
        returnPercent: 13.95,
        holdings: 8,
        riskScore: 6.5,
    };

    const sectorAllocation = [
        { sector: "IT", percentage: 35, color: "bg-blue-500" },
        { sector: "Banking", percentage: 25, color: "bg-green-500" },
        { sector: "Energy", percentage: 20, color: "bg-yellow-500" },
        { sector: "Auto", percentage: 15, color: "bg-purple-500" },
        { sector: "Others", percentage: 5, color: "bg-gray-500" },
    ];

    const topHoldings = [
        { symbol: "INFY", allocation: 22.5, value: 28202 },
        { symbol: "TCS", allocation: 18.2, value: 22812 },
        { symbol: "RELIANCE", allocation: 16.8, value: 21057 },
    ];

    return (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-4">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                    Portfolio Snapshot
                </h3>
                <button className="text-[10px] text-blue-400 hover:text-blue-300">
                    View Details
                </button>
            </div>

            {/* Portfolio Value */}
            <div className="mb-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-3">
                <div className="mb-1 text-[11px] text-gray-400">
                    Total Portfolio Value
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-white">
                        ₹{portfolio.totalValue.toLocaleString("en-IN")}
                    </span>
                    <span className="flex items-center gap-0.5 text-sm text-[#4ade80]">
                        <TrendingUp className="h-3.5 w-3.5" />+
                        {portfolio.returnPercent}%
                    </span>
                </div>
                <div className="mt-2 text-[10px] text-gray-500">
                    Returns: ₹
                    {(
                        portfolio.totalValue - portfolio.investedCapital
                    ).toLocaleString("en-IN")}
                </div>
            </div>

            {/* Capital Overview */}
            <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded bg-black/30 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-gray-500">
                        <Wallet className="h-3 w-3" />
                        Invested
                    </div>
                    <div className="text-xs font-semibold text-white">
                        ₹{(portfolio.investedCapital / 1000).toFixed(0)}k
                    </div>
                </div>
                <div className="rounded bg-black/30 p-2.5">
                    <div className="mb-1 text-[10px] text-gray-500">
                        Free Cash
                    </div>
                    <div className="text-xs font-semibold text-white">
                        ₹{(portfolio.freeCapital / 1000).toFixed(0)}k
                    </div>
                </div>
                <div className="rounded bg-black/30 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-gray-500">
                        <Shield className="h-3 w-3" />
                        Risk
                    </div>
                    <div className="text-xs font-semibold text-yellow-400">
                        {portfolio.riskScore}/10
                    </div>
                </div>
            </div>

            {/* Sector Allocation */}
            <div className="mb-4">
                <div className="mb-2 flex items-center gap-1 text-[11px] text-gray-500">
                    <PieChart className="h-3.5 w-3.5" />
                    Sector Diversification
                </div>
                <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full bg-black/40">
                    {sectorAllocation.map((sector, idx) => (
                        <div
                            key={sector.sector}
                            className={`${sector.color} ${
                                idx === 0 ? "rounded-l-full" : ""
                            } ${
                                idx === sectorAllocation.length - 1
                                    ? "rounded-r-full"
                                    : ""
                            }`}
                            style={{ width: `${sector.percentage}%` }}
                            title={`${sector.sector}: ${sector.percentage}%`}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {sectorAllocation.map((sector) => (
                        <div
                            key={sector.sector}
                            className="flex items-center gap-1"
                        >
                            <div
                                className={`h-2 w-2 rounded-full ${sector.color}`}
                            />
                            <span className="text-[10px] text-gray-400">
                                {sector.sector} {sector.percentage}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Holdings */}
            <div>
                <div className="mb-2 text-[11px] text-gray-500">
                    Top Holdings ({portfolio.holdings} total)
                </div>
                <div className="space-y-1.5">
                    {topHoldings.map((holding) => (
                        <div
                            key={holding.symbol}
                            className="flex items-center justify-between rounded bg-black/30 p-2"
                        >
                            <div className="flex items-center gap-2">
                                <div className="text-[11px] font-medium text-white">
                                    {holding.symbol}
                                </div>
                                <div className="h-1 w-12 overflow-hidden rounded-full bg-black/60">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{
                                            width: `${holding.allocation * 5}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[11px] font-semibold text-white">
                                    ${holding.value.toLocaleString("en-US")}
                                </div>
                                <div className="text-[9px] text-gray-500">
                                    {holding.allocation}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

