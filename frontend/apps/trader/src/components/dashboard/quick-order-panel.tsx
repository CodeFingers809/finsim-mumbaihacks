"use client";

import { TrendingUp, TrendingDown, BarChart3, Zap } from "lucide-react";
import { useState } from "react";

export function QuickOrderPanel() {
    const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
    const [orderType, setOrderType] = useState<"market" | "limit" | "sl">(
        "market"
    );

    const quickSymbols = ["RELIANCE", "TCS", "INFY", "HDFC", "ICICIBANK"];

    return (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-4">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <h3 className="text-sm font-medium text-white">
                        Quick Order
                    </h3>
                </div>
            </div>

            {/* Symbol Selector */}
            <div className="mb-3">
                <div className="mb-1.5 text-[10px] text-gray-500">
                    Select Symbol
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {quickSymbols.map((symbol) => (
                        <button
                            key={symbol}
                            onClick={() => setSelectedSymbol(symbol)}
                            className={`flex-shrink-0 rounded px-3 py-1.5 text-[11px] font-medium transition-colors ${
                                selectedSymbol === symbol
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                    : "bg-black/40 text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                            }`}
                        >
                            {symbol}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Price */}
            <div className="mb-3 rounded-lg bg-black/40 p-2.5">
                <div className="mb-0.5 text-[10px] text-gray-500">
                    Current Price
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-white">
                        ₹1,530.60
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-[#f87171]">
                        <TrendingDown className="h-3 w-3" />
                        -1.12%
                    </span>
                </div>
            </div>

            {/* Order Type */}
            <div className="mb-3">
                <div className="mb-1.5 text-[10px] text-gray-500">
                    Order Type
                </div>
                <div className="flex gap-1 rounded bg-black/40 p-1">
                    <button
                        onClick={() => setOrderType("market")}
                        className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                            orderType === "market"
                                ? "bg-[#1a1a1a] text-white"
                                : "text-gray-500 hover:text-white"
                        }`}
                    >
                        Market
                    </button>
                    <button
                        onClick={() => setOrderType("limit")}
                        className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                            orderType === "limit"
                                ? "bg-[#1a1a1a] text-white"
                                : "text-gray-500 hover:text-white"
                        }`}
                    >
                        Limit
                    </button>
                    <button
                        onClick={() => setOrderType("sl")}
                        className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                            orderType === "sl"
                                ? "bg-[#1a1a1a] text-white"
                                : "text-gray-500 hover:text-white"
                        }`}
                    >
                        SL
                    </button>
                </div>
            </div>

            {/* Quantity Input */}
            <div className="mb-3">
                <div className="mb-1.5 text-[10px] text-gray-500">Quantity</div>
                <input
                    type="number"
                    defaultValue="1"
                    className="w-full rounded-lg border border-[#2a2a2a] bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Enter quantity"
                />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-1.5 rounded-lg bg-[#4ade80] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#3dca70]">
                    <TrendingUp className="h-4 w-4" />
                    Buy
                </button>
                <button className="flex items-center justify-center gap-1.5 rounded-lg bg-[#f87171] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e85c5c]">
                    <TrendingDown className="h-4 w-4" />
                    Sell
                </button>
                <button className="flex items-center justify-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-black/40 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a1a1a]">
                    <BarChart3 className="h-4 w-4" />
                    Chart
                </button>
            </div>

            {/* Quick Info */}
            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
                <span>Available: ₹50,000</span>
                <span>Required: ₹1,530</span>
            </div>
        </div>
    );
}

