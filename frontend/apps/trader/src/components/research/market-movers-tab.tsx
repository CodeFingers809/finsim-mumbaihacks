"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Activity, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MoverStock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
}

export function MarketMoversTab() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"gainers" | "losers" | "active">(
        "gainers"
    );

    const { data: movers, isLoading } = useQuery<MoverStock[]>({
        queryKey: ["movers", activeTab],
        queryFn: async () => {
            const response = await fetch(`/api/movers?type=${activeTab}`);
            if (!response.ok) throw new Error("Failed to fetch market movers");
            return response.json();
        },
        refetchInterval: 60000,
    });

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-IN").format(num);
    };

    const formatCurrency = (num: number) => {
        return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    };

    const formatMarketCap = (marketCap?: number) => {
        if (!marketCap) return "N/A";
        if (marketCap >= 1e7) return `₹${(marketCap / 1e7).toFixed(2)} Cr`;
        if (marketCap >= 1e5) return `₹${(marketCap / 1e5).toFixed(2)} L`;
        return formatCurrency(marketCap);
    };

    const handleStockClick = (symbol: string) => {
        router.push(`/stock/${symbol}`);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[#e8eaed]">
                        Market Movers
                    </h2>
                    <p className="text-xs text-[#8b8f9a]">
                        Real-time top gainers, losers, and most active stocks
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-lg w-fit">
                {[
                    {
                        id: "gainers",
                        label: "Top Gainers",
                        icon: TrendingUp,
                        color: "text-[#3dd68c]",
                    },
                    {
                        id: "losers",
                        label: "Top Losers",
                        icon: TrendingDown,
                        color: "text-[#f06c6c]",
                    },
                    {
                        id: "active",
                        label: "Most Active",
                        icon: Activity,
                        color: "text-[#6c8cff]",
                    },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all duration-200",
                            activeTab === tab.id
                                ? "bg-[#6c8cff] text-white shadow-md"
                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                        )}
                    >
                        <tab.icon
                            className={cn(
                                "h-3.5 w-3.5",
                                activeTab === tab.id ? "text-white" : tab.color
                            )}
                        />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="h-16 rounded-xl bg-[#1a1d24] animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                        <div className="col-span-3">Stock</div>
                        <div className="col-span-2 text-right">Price</div>
                        <div className="col-span-2 text-right">Change</div>
                        <div className="col-span-2 text-right">Change %</div>
                        <div className="col-span-2 text-right">Volume</div>
                        <div className="col-span-1 text-right">Mkt Cap</div>
                    </div>

                    {/* Table Body */}
                    {movers && movers.length > 0 ? (
                        movers.slice(0, 15).map((stock, index) => {
                            const isPositive = stock.change >= 0;
                            return (
                                <div
                                    key={stock.symbol}
                                    onClick={() =>
                                        handleStockClick(stock.symbol)
                                    }
                                    className="group grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] cursor-pointer transition-all duration-200 hover:border-[#6c8cff]/40 hover:bg-[#1e2028]"
                                >
                                    {/* Stock Info */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium text-[#e8eaed]">
                                                    {stock.symbol}
                                                </span>
                                                <ExternalLink className="h-3 w-3 text-[#6c8cff] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-[10px] text-[#8b8f9a] line-clamp-1">
                                                {stock.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-2 text-right">
                                        <span className="text-sm font-mono font-semibold text-[#e8eaed]">
                                            {formatCurrency(stock.price)}
                                        </span>
                                    </div>

                                    {/* Change */}
                                    <div className="col-span-2 text-right">
                                        <span
                                            className={cn(
                                                "text-sm font-mono font-medium",
                                                isPositive
                                                    ? "text-[#3dd68c]"
                                                    : "text-[#f06c6c]"
                                            )}
                                        >
                                            {isPositive ? "+" : ""}
                                            {formatCurrency(stock.change)}
                                        </span>
                                    </div>

                                    {/* Change Percent */}
                                    <div className="col-span-2 text-right">
                                        <div
                                            className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold",
                                                isPositive
                                                    ? "bg-[#3dd68c]/15 text-[#3dd68c]"
                                                    : "bg-[#f06c6c]/15 text-[#f06c6c]"
                                            )}
                                        >
                                            {isPositive ? "+" : ""}
                                            {stock.changePercent.toFixed(2)}%
                                        </div>
                                    </div>

                                    {/* Volume */}
                                    <div className="col-span-2 text-right">
                                        <span className="text-sm font-mono text-[#8b8f9a]">
                                            {formatNumber(stock.volume)}
                                        </span>
                                    </div>

                                    {/* Market Cap */}
                                    <div className="col-span-1 text-right">
                                        <span className="text-sm font-mono text-[#8b8f9a]">
                                            {formatMarketCap(stock.marketCap)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-[#8b8f9a]">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No data available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

