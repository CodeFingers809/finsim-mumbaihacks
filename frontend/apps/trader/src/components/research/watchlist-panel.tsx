"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Watchlist } from "@trader/types";
import { Plus, Search, Trash2, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { MarketQuote } from "@trader/types";

interface SearchResult {
    symbol: string;
    name: string;
}

interface WatchlistPanelProps {
    watchlists: Watchlist[];
    activeWatchlistId?: string;
    onSelectWatchlist: (id: string) => void;
    onCreateWatchlist: (name: string) => void;
    onAddSymbol: (symbol: string) => void;
    onRemoveSymbol: (symbol: string) => void;
    quotes: Record<string, MarketQuote>;
    isQuotesLoading: boolean;
}

export function WatchlistPanel({
    watchlists,
    activeWatchlistId,
    onSelectWatchlist,
    onCreateWatchlist,
    onAddSymbol,
    onRemoveSymbol,
    quotes,
    isQuotesLoading,
}: WatchlistPanelProps) {
    const router = useRouter();
    const [newWatchlistName, setNewWatchlistName] = useState("Momentum");
    const [showAddStock, setShowAddStock] = useState(false);
    const [stockSearch, setStockSearch] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const activeWatchlist = watchlists.find(
        (watchlist) => watchlist._id === activeWatchlistId
    );

    // Navigate to stock detail page
    const handleStockClick = (symbol: string) => {
        router.push(`/stock/${symbol}`);
    };

    // Search for stocks
    useEffect(() => {
        const searchStocks = async () => {
            if (stockSearch.length < 1) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(
                    `/api/stocks/search?q=${encodeURIComponent(stockSearch)}`
                );
                const results = await response.json();
                setSearchResults(results);
            } catch (error) {
                console.error("Failed to search stocks:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchStocks, 300);
        return () => clearTimeout(debounce);
    }, [stockSearch]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-widest text-[#8b8f9a]">
                    Watchlists
                </h3>
                <button
                    onClick={() => setShowAddStock(!showAddStock)}
                    className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                        showAddStock
                            ? "bg-[#f06c6c]/15 text-[#f06c6c] border border-[#f06c6c]/30"
                            : "bg-[#3dd68c]/15 text-[#3dd68c] border border-[#3dd68c]/30 hover:bg-[#3dd68c]/25"
                    )}
                >
                    {showAddStock ? (
                        <X className="h-3 w-3" />
                    ) : (
                        <Plus className="h-3 w-3" />
                    )}
                    {showAddStock ? "Close" : "Add Stock"}
                </button>
            </div>

            {/* Add Stock Search Panel */}
            {showAddStock && (
                <div className="space-y-2 rounded-lg border border-[#2d303a]/50 bg-[#1a1d24] p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8f9a]" />
                        <input
                            placeholder="Search stocks (e.g., RELIANCE, TCS)..."
                            value={stockSearch}
                            onChange={(e) => setStockSearch(e.target.value)}
                            className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] pl-10 pr-4 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none focus:ring-1 focus:ring-[#6c8cff]/30"
                        />
                    </div>

                    {stockSearch && (
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-[#2d303a]/40 bg-[#0c0d10]">
                            {isSearching ? (
                                <div className="p-3 text-center text-xs text-[#8b8f9a]">
                                    Searching...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="divide-y divide-[#2d303a]/30">
                                    {searchResults.map((result) => (
                                        <button
                                            key={result.symbol}
                                            onClick={() => {
                                                onAddSymbol(result.symbol);
                                                setStockSearch("");
                                                setShowAddStock(false);
                                            }}
                                            className="w-full px-3 py-2 text-left transition-colors hover:bg-[#1a1d24]"
                                        >
                                            <div className="text-xs font-medium text-[#e8eaed]">
                                                {result.symbol}
                                            </div>
                                            <div className="text-[10px] text-[#8b8f9a]">
                                                {result.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 text-center text-xs text-[#8b8f9a]">
                                    No results found
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Create Watchlist Input */}
            <div className="flex gap-2">
                <input
                    placeholder="Create new watchlist..."
                    value={newWatchlistName}
                    onChange={(event) =>
                        setNewWatchlistName(event.target.value)
                    }
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && newWatchlistName.trim()) {
                            onCreateWatchlist(newWatchlistName);
                            setNewWatchlistName("");
                        }
                    }}
                    className="flex-1 h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] px-3 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none focus:ring-1 focus:ring-[#6c8cff]/30"
                />
                <button
                    onClick={() => {
                        if (newWatchlistName.trim()) {
                            onCreateWatchlist(newWatchlistName);
                            setNewWatchlistName("");
                        }
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#2d303a]/60 bg-[#1a1d24] text-[#8b8f9a] hover:bg-[#252730] hover:text-[#e8eaed] transition-colors"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            {/* Watchlist Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-[#1a1d24] rounded-lg">
                {watchlists.map((watchlist) => (
                    <button
                        key={watchlist._id}
                        onClick={() => onSelectWatchlist(watchlist._id)}
                        className={cn(
                            "px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 truncate max-w-[100px]",
                            activeWatchlistId === watchlist._id
                                ? "bg-[#6c8cff] text-white shadow-md"
                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                        )}
                        title={watchlist.name}
                    >
                        {watchlist.name}
                    </button>
                ))}
            </div>

            {/* Search in Watchlist */}
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8f9a]" />
                <input
                    placeholder="Search eg: INFY, NIFTY"
                    className="w-full h-9 rounded-lg border border-[#2d303a]/60 bg-[#0c0d10] pl-10 pr-4 text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60 focus:border-[#6c8cff]/50 focus:outline-none focus:ring-1 focus:ring-[#6c8cff]/30"
                />
            </div>

            {/* Stock List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {isQuotesLoading &&
                activeWatchlist?.stocks.length &&
                Object.keys(quotes).length === 0 ? (
                    <div className="space-y-2">
                        {activeWatchlist.stocks.map((stock) => (
                            <div
                                key={stock.symbol}
                                className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="h-4 w-16 bg-[#2d303a]/50 rounded animate-pulse" />
                                        <div className="h-6 w-24 bg-[#2d303a]/50 rounded animate-pulse" />
                                    </div>
                                    <div className="text-right space-y-2">
                                        <div className="h-6 w-16 bg-[#2d303a]/50 rounded-lg animate-pulse" />
                                        <div className="h-4 w-12 bg-[#2d303a]/50 rounded animate-pulse ml-auto" />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="h-3 w-12 bg-[#2d303a]/50 rounded animate-pulse"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    activeWatchlist?.stocks.map((stock) => {
                        const quote = quotes[stock.symbol];
                        const positive = (quote?.change ?? 0) >= 0;
                        return (
                            <div
                                key={stock.symbol}
                                className="group rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3 cursor-pointer transition-all duration-200 hover:border-[#6c8cff]/40 hover:bg-[#1e2028]"
                                onClick={() => handleStockClick(stock.symbol)}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-medium uppercase tracking-wide text-[#e8eaed]">
                                                {stock.symbol}
                                            </p>
                                            <ExternalLink className="h-3 w-3 text-[#6c8cff] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                        </div>
                                        <p className="text-lg font-bold font-mono text-[#e8eaed] mt-0.5">
                                            ₹
                                            {quote
                                                ? quote.lastPrice.toFixed(2)
                                                : "--"}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div
                                            className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold",
                                                positive
                                                    ? "bg-[#3dd68c]/15 text-[#3dd68c]"
                                                    : "bg-[#f06c6c]/15 text-[#f06c6c]"
                                            )}
                                        >
                                            {positive ? "+" : ""}
                                            {quote
                                                ? quote.change.toFixed(2)
                                                : "--"}
                                        </div>
                                        <p className="text-[11px] text-[#8b8f9a] mt-1">
                                            {quote
                                                ? `${
                                                      positive ? "+" : ""
                                                  }${quote.changePercent.toFixed(
                                                      2
                                                  )}%`
                                                : "0%"}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-[10px] text-[#8b8f9a]">
                                    <span>O: {quote?.open ?? "--"}</span>
                                    <span>H: {quote?.dayHigh ?? "--"}</span>
                                    <span>L: {quote?.dayLow ?? "--"}</span>
                                    <span>
                                        Vol:{" "}
                                        {quote?.volume?.toLocaleString() ??
                                            "--"}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[10px] text-[#8b8f9a]">
                                        Prev: {quote?.previousClose ?? "--"}
                                    </span>
                                    <button
                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-[#f06c6c] hover:bg-[#f06c6c]/10 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveSymbol(stock.symbol);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" /> Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
                {!isQuotesLoading && !activeWatchlist?.stocks.length && (
                    <div className="text-center py-8 text-sm text-[#8b8f9a]">
                        Add your first symbol to start tracking live moves.
                    </div>
                )}
            </div>
        </div>
    );
}

