"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    ExternalLink,
    RotateCcw,
    SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ScreenerStock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    pe?: number;
    eps?: number;
    beta?: number;
    dividendYield?: number;
    sector?: string;
    industry?: string;
    exchange?: string;
}

interface ScreenerFilters {
    minPrice: string;
    maxPrice: string;
    minVolume: string;
    minMarketCap: string;
    maxMarketCap: string;
    minPE: string;
    maxPE: string;
    sector: string;
    exchange: string;
}

export function StockScreenerTab() {
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState<ScreenerFilters>({
        minPrice: "",
        maxPrice: "",
        minVolume: "",
        minMarketCap: "",
        maxMarketCap: "",
        minPE: "",
        maxPE: "",
        sector: "",
        exchange: "",
    });

    const [appliedFilters, setAppliedFilters] =
        useState<ScreenerFilters>(filters);

    const { data: stocks, isLoading } = useQuery<ScreenerStock[]>({
        queryKey: ["screener", appliedFilters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (appliedFilters.minPrice)
                params.append("minPrice", appliedFilters.minPrice);
            if (appliedFilters.maxPrice)
                params.append("maxPrice", appliedFilters.maxPrice);
            if (appliedFilters.minVolume)
                params.append("minVolume", appliedFilters.minVolume);
            if (appliedFilters.minMarketCap)
                params.append("minMarketCap", appliedFilters.minMarketCap);
            if (appliedFilters.maxMarketCap)
                params.append("maxMarketCap", appliedFilters.maxMarketCap);
            if (appliedFilters.minPE)
                params.append("minPE", appliedFilters.minPE);
            if (appliedFilters.maxPE)
                params.append("maxPE", appliedFilters.maxPE);
            if (appliedFilters.sector)
                params.append("sector", appliedFilters.sector);
            if (appliedFilters.exchange)
                params.append("exchange", appliedFilters.exchange);

            const response = await fetch(`/api/screener?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch screener data");
            return response.json();
        },
        refetchInterval: 60000,
    });

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
    };

    const handleResetFilters = () => {
        const emptyFilters: ScreenerFilters = {
            minPrice: "",
            maxPrice: "",
            minVolume: "",
            minMarketCap: "",
            maxMarketCap: "",
            minPE: "",
            maxPE: "",
            sector: "",
            exchange: "",
        };
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
    };

    const handleStockClick = (symbol: string) => {
        router.push(`/stock/${symbol}`);
    };

    const formatCurrency = (num: number) => {
        return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-IN").format(num);
    };

    const formatMarketCap = (marketCap: number) => {
        if (marketCap >= 1e12) return `₹${(marketCap / 1e12).toFixed(2)}T`;
        if (marketCap >= 1e9) return `₹${(marketCap / 1e9).toFixed(2)}B`;
        if (marketCap >= 1e6) return `₹${(marketCap / 1e6).toFixed(2)}M`;
        return formatCurrency(marketCap);
    };

    const sectors = [
        "Technology",
        "Healthcare",
        "Financial Services",
        "Consumer Cyclical",
        "Industrials",
        "Energy",
    ];
    const exchanges = ["NSE", "BSE", "NASDAQ", "NYSE"];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[#e8eaed]">
                        Stock Screener
                    </h2>
                    <p className="text-xs text-[#8b8f9a]">
                        Filter and discover stocks based on your criteria
                    </p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                        showFilters
                            ? "bg-[#6c8cff]/15 border border-[#6c8cff]/40 text-[#6c8cff]"
                            : "bg-[#1a1d24] border border-[#2d303a]/60 text-[#8b8f9a] hover:bg-[#1e2028]"
                    )}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {/* Min Price */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                                Min Price
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 100"
                                value={filters.minPrice}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        minPrice: e.target.value,
                                    })
                                }
                                className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] px-3 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none"
                            />
                        </div>

                        {/* Max Price */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                                Max Price
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 5000"
                                value={filters.maxPrice}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        maxPrice: e.target.value,
                                    })
                                }
                                className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] px-3 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none"
                            />
                        </div>

                        {/* Min Volume */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                                Min Volume
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 100000"
                                value={filters.minVolume}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        minVolume: e.target.value,
                                    })
                                }
                                className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] px-3 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none"
                            />
                        </div>

                        {/* P/E Range */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                                Min P/E
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 5"
                                value={filters.minPE}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        minPE: e.target.value,
                                    })
                                }
                                className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] px-3 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none"
                            />
                        </div>

                        {/* Sector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                                Sector
                            </label>
                            <select
                                value={filters.sector}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        sector: e.target.value,
                                    })
                                }
                                className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] px-3 text-sm text-[#e8eaed] focus:border-[#6c8cff]/50 focus:outline-none appearance-none cursor-pointer"
                            >
                                <option value="">All Sectors</option>
                                {sectors.map((sector) => (
                                    <option key={sector} value={sector}>
                                        {sector}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Exchange */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                                Exchange
                            </label>
                            <select
                                value={filters.exchange}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        exchange: e.target.value,
                                    })
                                }
                                className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] px-3 text-sm text-[#e8eaed] focus:border-[#6c8cff]/50 focus:outline-none appearance-none cursor-pointer"
                            >
                                <option value="">All Exchanges</option>
                                {exchanges.map((exchange) => (
                                    <option key={exchange} value={exchange}>
                                        {exchange}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={handleApplyFilters}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6c8cff] text-white text-xs font-medium hover:bg-[#5a7ae8] transition-colors"
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Apply Filters
                        </button>
                        <button
                            onClick={handleResetFilters}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#2d303a]/60 bg-[#1a1d24] text-[#8b8f9a] text-xs font-medium hover:bg-[#252730] hover:text-[#e8eaed] transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </button>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-[#8b8f9a]">
                        {stocks
                            ? `${stocks.length} stocks match your criteria`
                            : "Loading..."}
                    </span>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-8 gap-3 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">
                    <div>Symbol</div>
                    <div className="col-span-2">Name</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Change</div>
                    <div className="text-right">Volume</div>
                    <div className="text-right">P/E</div>
                    <div className="text-right">Mkt Cap</div>
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className="h-14 rounded-xl bg-[#1a1d24] animate-pulse"
                            />
                        ))}
                    </div>
                ) : stocks && stocks.length > 0 ? (
                    <div className="space-y-2">
                        {stocks.slice(0, 20).map((stock) => {
                            const isPositive = stock.changePercent >= 0;
                            return (
                                <div
                                    key={stock.symbol}
                                    onClick={() =>
                                        handleStockClick(stock.symbol)
                                    }
                                    className="group grid grid-cols-8 gap-3 items-center px-4 py-3 rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] cursor-pointer transition-all duration-200 hover:border-[#6c8cff]/40 hover:bg-[#1e2028]"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-[#e8eaed]">
                                            {stock.symbol}
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-[#6c8cff] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-xs text-[#8b8f9a] line-clamp-1">
                                            {stock.name}
                                        </span>
                                        <span className="text-[10px] text-[#8b8f9a]/60">
                                            {stock.sector || "N/A"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-mono font-semibold text-[#e8eaed]">
                                            {formatCurrency(stock.price)}
                                        </span>
                                    </div>
                                    <div className="text-right">
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
                                    <div className="text-right">
                                        <span className="text-sm font-mono text-[#8b8f9a]">
                                            {formatNumber(stock.volume)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-mono text-[#8b8f9a]">
                                            {stock.pe
                                                ? stock.pe.toFixed(2)
                                                : "N/A"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-mono text-[#8b8f9a]">
                                            {formatMarketCap(stock.marketCap)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-[#8b8f9a]">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                            No stocks match your criteria. Try adjusting your
                            filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

