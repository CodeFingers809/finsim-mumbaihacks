"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    UserCheck,
    TrendingUp,
    TrendingDown,
    Search,
    ExternalLink,
    DollarSign,
    Users,
    Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface InsiderTrade {
    symbol: string;
    companyName: string;
    filingDate: string;
    transactionDate: string;
    insider: string;
    title: string;
    transactionType: string;
    shares: number;
    pricePerShare: number;
    totalValue: number;
    sharesOwned: number;
    link: string;
}

export function InsiderTradingTab() {
    const router = useRouter();
    const [searchSymbol, setSearchSymbol] = useState("RELIANCE");
    const [activeFilter, setActiveFilter] = useState<"all" | "buys" | "sells">(
        "all"
    );

    const { data: trades, isLoading } = useQuery<InsiderTrade[]>({
        queryKey: ["insider-trading", searchSymbol],
        queryFn: async () => {
            if (!searchSymbol) return [];
            const response = await fetch(
                `/api/insider-trading?symbol=${searchSymbol}&limit=50`
            );
            if (!response.ok)
                throw new Error("Failed to fetch insider trading");
            return response.json();
        },
        enabled: !!searchSymbol,
        refetchInterval: 300000,
    });

    const handleStockClick = (symbol: string) => {
        router.push(`/stock/${symbol}`);
    };

    const formatCurrency = (num: number) => {
        return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-IN").format(num);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatValue = (value: number) => {
        if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
        if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`;
        return formatCurrency(value);
    };

    const isPurchase = (type: string) =>
        type.toLowerCase().includes("p") ||
        type.toLowerCase().includes("purchase") ||
        type.toLowerCase().includes("buy");

    const isSale = (type: string) =>
        type.toLowerCase().includes("s") ||
        type.toLowerCase().includes("sale") ||
        type.toLowerCase().includes("sell");

    const purchases =
        trades?.filter((t) => isPurchase(t.transactionType)) || [];
    const sales = trades?.filter((t) => isSale(t.transactionType)) || [];

    const filteredTrades =
        activeFilter === "all"
            ? trades
            : activeFilter === "buys"
            ? purchases
            : sales;

    const totalPurchaseValue = purchases.reduce(
        (sum, t) => sum + t.totalValue,
        0
    );
    const totalSaleValue = sales.reduce((sum, t) => sum + t.totalValue, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[#e8eaed]">
                        Insider Trading
                    </h2>
                    <p className="text-xs text-[#8b8f9a]">
                        Track what company insiders are buying and selling
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8f9a]" />
                    <input
                        placeholder="Search by symbol (e.g., RELIANCE)"
                        value={searchSymbol}
                        onChange={(e) =>
                            setSearchSymbol(e.target.value.toUpperCase())
                        }
                        className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#1a1d24] pl-10 pr-4 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-lg">
                    {[
                        { id: "all", label: "All Trades", icon: Users },
                        {
                            id: "buys",
                            label: "Buys Only",
                            icon: TrendingUp,
                            color: "text-[#3dd68c]",
                        },
                        {
                            id: "sells",
                            label: "Sells Only",
                            icon: TrendingDown,
                            color: "text-[#f06c6c]",
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id as any)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                                activeFilter === tab.id
                                    ? "bg-[#6c8cff] text-white shadow-md"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                        >
                            <tab.icon
                                className={cn(
                                    "h-3.5 w-3.5",
                                    activeFilter === tab.id
                                        ? "text-white"
                                        : tab.color
                                )}
                            />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            {trades && trades.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-[#6c8cff]" />
                            <span className="text-xs text-[#8b8f9a]">
                                Total Trades
                            </span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-[#e8eaed]">
                            {trades.length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-[#3dd68c]/20 bg-[#3dd68c]/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-[#3dd68c]" />
                            <span className="text-xs text-[#8b8f9a]">
                                Purchase Value
                            </span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-[#3dd68c]">
                            {formatValue(totalPurchaseValue)}
                        </p>
                        <p className="text-[10px] text-[#8b8f9a] mt-1">
                            {purchases.length} transactions
                        </p>
                    </div>
                    <div className="rounded-xl border border-[#f06c6c]/20 bg-[#f06c6c]/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="h-4 w-4 text-[#f06c6c]" />
                            <span className="text-xs text-[#8b8f9a]">
                                Sale Value
                            </span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-[#f06c6c]">
                            {formatValue(totalSaleValue)}
                        </p>
                        <p className="text-[10px] text-[#8b8f9a] mt-1">
                            {sales.length} transactions
                        </p>
                    </div>
                </div>
            )}

            {/* Trades List */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 rounded-xl bg-[#1a1d24] animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredTrades && filteredTrades.length > 0 ? (
                <div className="space-y-2">
                    {/* Header Row */}
                    <div className="grid grid-cols-7 gap-3 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                        <div>Date</div>
                        <div className="col-span-2">Insider</div>
                        <div>Type</div>
                        <div className="text-right">Shares</div>
                        <div className="text-right">Price</div>
                        <div className="text-right">Value</div>
                    </div>

                    {/* Trade Rows */}
                    {filteredTrades.slice(0, 20).map((trade, idx) => {
                        const isBuy = isPurchase(trade.transactionType);
                        return (
                            <div
                                key={`${trade.symbol}-${idx}`}
                                onClick={() => handleStockClick(trade.symbol)}
                                className="group grid grid-cols-7 gap-3 items-center px-4 py-3 rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] cursor-pointer transition-all duration-200 hover:border-[#6c8cff]/40 hover:bg-[#1e2028]"
                            >
                                {/* Date */}
                                <div>
                                    <span className="text-xs text-[#e8eaed]">
                                        {formatDate(trade.transactionDate)}
                                    </span>
                                </div>

                                {/* Insider Info */}
                                <div className="col-span-2">
                                    <div className="flex items-center gap-1.5">
                                        <UserCheck className="h-3.5 w-3.5 text-[#6c8cff]" />
                                        <span className="text-sm font-medium text-[#e8eaed] line-clamp-1">
                                            {trade.insider}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Briefcase className="h-3 w-3 text-[#8b8f9a]" />
                                        <span className="text-[10px] text-[#8b8f9a] line-clamp-1">
                                            {trade.title}
                                        </span>
                                    </div>
                                </div>

                                {/* Transaction Type */}
                                <div>
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold",
                                            isBuy
                                                ? "bg-[#3dd68c]/15 text-[#3dd68c]"
                                                : "bg-[#f06c6c]/15 text-[#f06c6c]"
                                        )}
                                    >
                                        {isBuy ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3" />
                                        )}
                                        {isBuy ? "Buy" : "Sell"}
                                    </span>
                                </div>

                                {/* Shares */}
                                <div className="text-right">
                                    <span className="text-sm font-mono text-[#e8eaed]">
                                        {formatNumber(trade.shares)}
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                    <span className="text-sm font-mono text-[#8b8f9a]">
                                        {formatCurrency(trade.pricePerShare)}
                                    </span>
                                </div>

                                {/* Total Value */}
                                <div className="text-right">
                                    <span
                                        className={cn(
                                            "text-sm font-mono font-semibold",
                                            isBuy
                                                ? "text-[#3dd68c]"
                                                : "text-[#f06c6c]"
                                        )}
                                    >
                                        {formatValue(trade.totalValue)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-[#8b8f9a]">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                        No insider trades found for {searchSymbol}
                    </p>
                    <p className="text-xs mt-1">
                        Try searching for a different symbol
                    </p>
                </div>
            )}
        </div>
    );
}

