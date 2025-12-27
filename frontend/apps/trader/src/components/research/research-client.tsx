"use client";

import { useEffect, useMemo, useState } from "react";
import type { Watchlist } from "@trader/types";
import type { MarketQuote } from "@trader/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    BarChart3,
    Newspaper,
    Activity,
    TrendingUp,
    Users,
    Search,
    Calendar,
    PieChart,
    Zap,
    Target,
    Wallet,
    ArrowLeft,
    CandlestickChart,
    LineChart,
    Grid3X3,
    RotateCcw,
    Maximize2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import { AccountSummary } from "@/components/research/account-summary";
import { MarketOverview } from "@/components/research/market-overview";
import { WatchlistPanel } from "@/components/research/watchlist-panel";
import { StockComparison } from "@/components/research/stock-comparison";
import { CorrelationMatrix } from "@/components/research/correlation-matrix";
import { ValuationMetrics } from "@/components/research/valuation-metrics";
import { TechnicalIndicators } from "@/components/research/technical-indicators";
import { NewsAndSentiment } from "@/components/research/news-sentiment";
import { PerformanceAnalytics } from "@/components/research/performance-analytics";
import { MarketMoversTab } from "@/components/research/market-movers-tab";
import { StockScreenerTab } from "@/components/research/stock-screener-tab";
import { EarningsCalendarTab } from "@/components/research/earnings-calendar-tab";
import { InsiderTradingTab } from "@/components/research/insider-trading-tab";
import { PortfolioSummaryVisual } from "@/components/research/portfolio-summary-visual";
import { WatchlistHeatmap } from "@/components/dashboard/watchlist-heatmap";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { cn } from "@/lib/utils/cn";
import { useWatchlistStore } from "@/hooks/use-watchlist-store";
import { TerminalLayout } from "@/components/layout/terminal-layout";

async function fetchWatchlists(): Promise<Watchlist[]> {
    const response = await fetch("/api/watchlist", { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Unable to fetch watchlists");
    }
    const data = await response.json();
    return data.watchlists || [];
}

async function fetchQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const response = await fetch(`/api/stocks?symbols=${symbols.join(",")}`);
    if (!response.ok) {
        throw new Error("Unable to fetch quotes");
    }
    return response.json();
}

export function ResearchClient() {
    const queryClient = useQueryClient();
    const [leftPanelTab, setLeftPanelTab] = useState<
        "watchlist" | "funds" | "portfolio"
    >("watchlist");
    const [rightPanelTab, setRightPanelTab] = useState<
        "overview" | "analysis" | "technical" | "news"
    >("overview");
    const [bottomTab, setBottomTab] = useState<
        "movers" | "screener" | "earnings" | "insider" | "performance"
    >("movers");
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const {
        watchlists,
        setWatchlists,
        activeWatchlistId,
        setActiveWatchlist,
        updateWatchlist,
    } = useWatchlistStore();

    const watchlistQuery = useQuery({
        queryKey: ["watchlists"],
        queryFn: fetchWatchlists,
        refetchInterval: 30_000,
    });

    useEffect(() => {
        if (watchlistQuery.data) {
            setWatchlists(watchlistQuery.data);
        }
    }, [watchlistQuery.data, setWatchlists]);

    const activeWatchlist = watchlists.find(
        (watchlist) => watchlist._id === activeWatchlistId
    );
    const symbols = activeWatchlist?.stocks?.map((stock) => stock.symbol) ?? [];

    const quotesQuery = useQuery({
        queryKey: ["quotes", symbols.join(",")],
        queryFn: () => fetchQuotes(symbols),
        enabled: symbols.length > 0,
        refetchInterval: 8000,
    });

    const quotesRecord = useMemo(() => {
        const map: Record<string, MarketQuote> = {};
        quotesQuery.data?.forEach((quote) => {
            map[quote.symbol] = quote;
        });
        return map;
    }, [quotesQuery.data]);

    const createWatchlistMutation = useMutation({
        mutationFn: async (name: string) => {
            const response = await fetch("/api/watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!response.ok) throw new Error("Failed to create watchlist");
            const data = await response.json();
            return data.watchlist;
        },
        onSuccess: (watchlist: Watchlist) => {
            queryClient.setQueryData<Watchlist[]>(
                ["watchlists"],
                (current = []) => [watchlist, ...current]
            );
            updateWatchlist(watchlist);
            setActiveWatchlist(watchlist._id);
            toast.success(`Watchlist "${watchlist.name}" created`);
        },
        onError: (error) =>
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to create watchlist"
            ),
    });

    const addSymbolMutation = useMutation({
        mutationFn: async (symbol: string) => {
            if (!activeWatchlistId) throw new Error("Select a watchlist first");
            const response = await fetch(
                `/api/watchlist/${activeWatchlistId}/stocks`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbol }),
                }
            );
            if (!response.ok) throw new Error("Failed to add symbol");
            const data = await response.json();
            return data.watchlist;
        },
        onSuccess: (watchlist: Watchlist) => {
            updateWatchlist(watchlist);
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
            toast.success("Symbol added to watchlist");
        },
        onError: (error) =>
            toast.error(
                error instanceof Error ? error.message : "Unable to add symbol"
            ),
    });

    const removeSymbolMutation = useMutation({
        mutationFn: async (symbol: string) => {
            if (!activeWatchlistId) throw new Error("Select a watchlist first");
            const response = await fetch(
                `/api/watchlist/${activeWatchlistId}/stocks/${symbol}`,
                {
                    method: "DELETE",
                }
            );
            if (!response.ok) throw new Error("Failed to remove symbol");
            const data = await response.json();
            return data.watchlist;
        },
        onSuccess: (watchlist: Watchlist) => {
            updateWatchlist(watchlist);
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
            toast.success("Symbol removed");
        },
        onError: (error) =>
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to remove symbol"
            ),
    });

    // Calculate total portfolio value for header display
    const totalValue = useMemo(() => {
        return Object.values(quotesRecord).reduce(
            (sum, quote) => sum + (quote.lastPrice || 0),
            0
        );
    }, [quotesRecord]);

    const totalChange = useMemo(() => {
        return Object.values(quotesRecord).reduce(
            (sum, quote) => sum + (quote.change || 0),
            0
        );
    }, [quotesRecord]);

    return (
        <TerminalLayout
            title={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
                    <span className="text-xs text-[#8b8f9a]">Watchlist:</span>
                    <span className="text-sm font-medium text-[#e8eaed]">
                        {activeWatchlist?.name || "None"}
                    </span>
                    <Badge
                        variant="outline"
                        className="text-[10px] bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                    >
                        {symbols.length} stocks
                    </Badge>
                </div>
            }
            centerContent={
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
                    <span className="text-xs text-[#8b8f9a]">
                        Portfolio Value
                    </span>
                    <span className="text-lg font-bold font-mono text-[#e8eaed]">
                        $
                        {totalValue.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                        })}
                    </span>
                    <div
                        className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-semibold",
                            totalChange >= 0
                                ? "bg-[#3dd68c]/15 text-[#3dd68c]"
                                : "bg-[#f06c6c]/15 text-[#f06c6c]"
                        )}
                    >
                        {totalChange >= 0 ? "+" : ""}${totalChange.toFixed(2)}
                    </div>
                </div>
            }
            rightActions={
                <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-xl">
                    <button
                        onClick={() => setShowLeftPanel(!showLeftPanel)}
                        className={cn(
                            "px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                            showLeftPanel
                                ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                        )}
                    >
                        Watchlist
                    </button>
                    <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        className={cn(
                            "px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                            showRightPanel
                                ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                        )}
                    >
                        Analysis
                    </button>
                </div>
            }
        >
            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden h-full">
                {/* Left Panel - Watchlist & Funds */}
                {showLeftPanel && (
                    <div className="w-[320px] lg:w-[360px] xl:w-[400px] border-r border-[#2d303a]/50 bg-[#12141a] flex flex-col shrink-0 h-full">
                        {/* Tabs Header */}
                        <div className="px-3 py-2 border-b border-[#2d303a]/40">
                            <div className="flex justify-center gap-1 p-1 bg-[#1a1d24] rounded-lg">
                                {[
                                    {
                                        id: "watchlist",
                                        label: "Watchlist",
                                        icon: Target,
                                    },
                                    {
                                        id: "funds",
                                        label: "Funds",
                                        icon: Wallet,
                                    },
                                    {
                                        id: "portfolio",
                                        label: "Portfolio",
                                        icon: PieChart,
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() =>
                                            setLeftPanelTab(tab.id as any)
                                        }
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200",
                                            leftPanelTab === tab.id
                                                ? "bg-[#6c8cff] text-white shadow-md"
                                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                                        )}
                                    >
                                        <tab.icon className="h-3.5 w-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {leftPanelTab === "watchlist" && (
                                <div className="p-4">
                                    <WatchlistPanel
                                        watchlists={watchlists}
                                        activeWatchlistId={activeWatchlistId}
                                        onSelectWatchlist={setActiveWatchlist}
                                        onCreateWatchlist={(name) =>
                                            createWatchlistMutation.mutate(name)
                                        }
                                        onAddSymbol={(symbol) =>
                                            addSymbolMutation.mutate(symbol)
                                        }
                                        onRemoveSymbol={(symbol) =>
                                            removeSymbolMutation.mutate(symbol)
                                        }
                                        quotes={quotesRecord}
                                        isQuotesLoading={quotesQuery.isLoading}
                                    />
                                </div>
                            )}
                            {leftPanelTab === "funds" && (
                                <div className="p-4">
                                    <AccountSummary />
                                </div>
                            )}
                            {leftPanelTab === "portfolio" && (
                                <div className="p-4">
                                    <PortfolioSummaryVisual
                                        quotes={quotesRecord}
                                        watchlist={activeWatchlist}
                                        isLoading={quotesQuery.isLoading}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Center - Main Content Area */}
                <div className="flex-1 flex flex-col bg-[#0c0d10] h-full overflow-hidden">
                    {/* Market Research Tabs - Primary Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Tab Header */}
                        <div className="px-4 py-3 border-b border-[#2d303a]/40 bg-[#12141a]/50">
                            <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-lg w-fit">
                                {[
                                    {
                                        id: "movers",
                                        label: "Market Movers",
                                        icon: TrendingUp,
                                    },
                                    {
                                        id: "screener",
                                        label: "Screener",
                                        icon: Search,
                                    },
                                    {
                                        id: "earnings",
                                        label: "Earnings",
                                        icon: Calendar,
                                    },
                                    {
                                        id: "insider",
                                        label: "Insider Trading",
                                        icon: Users,
                                    },
                                    {
                                        id: "performance",
                                        label: "Performance",
                                        icon: Activity,
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() =>
                                            setBottomTab(tab.id as any)
                                        }
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all duration-200",
                                            bottomTab === tab.id
                                                ? "bg-[#6c8cff] text-white shadow-md"
                                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                                        )}
                                    >
                                        <tab.icon className="h-3.5 w-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            {bottomTab === "movers" && <MarketMoversTab />}
                            {bottomTab === "screener" && <StockScreenerTab />}
                            {bottomTab === "earnings" && (
                                <EarningsCalendarTab />
                            )}
                            {bottomTab === "insider" && <InsiderTradingTab />}
                            {bottomTab === "performance" && (
                                <PerformanceAnalytics
                                    quotes={quotesRecord}
                                    watchlist={activeWatchlist}
                                    isLoading={quotesQuery.isLoading}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Analysis */}
                {showRightPanel && (
                    <div className="w-[320px] lg:w-[360px] xl:w-[400px] border-l border-[#2d303a]/50 bg-[#12141a] flex flex-col shrink-0 h-full">
                        {/* Tabs Header */}
                        <div className="px-3 py-2 border-b border-[#2d303a]/40">
                            <div className="flex justify-center gap-1 p-1 bg-[#1a1d24] rounded-lg">
                                {[
                                    {
                                        id: "overview",
                                        label: "Overview",
                                        icon: BarChart3,
                                    },
                                    {
                                        id: "analysis",
                                        label: "Analysis",
                                        icon: Activity,
                                    },
                                    {
                                        id: "technical",
                                        label: "Technical",
                                        icon: Zap,
                                    },
                                    {
                                        id: "news",
                                        label: "News",
                                        icon: Newspaper,
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() =>
                                            setRightPanelTab(tab.id as any)
                                        }
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200",
                                            rightPanelTab === tab.id
                                                ? "bg-[#6c8cff] text-white shadow-md"
                                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                                        )}
                                    >
                                        <tab.icon className="h-3.5 w-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            {rightPanelTab === "overview" && (
                                <div className="space-y-4">
                                    <MarketOverview
                                        quotes={quotesRecord}
                                        watchlist={activeWatchlist}
                                        isLoading={quotesQuery.isLoading}
                                    />
                                    <WatchlistHeatmap
                                        quotes={quotesRecord}
                                        watchlist={activeWatchlist}
                                        isLoading={quotesQuery.isLoading}
                                    />
                                    <AlertsPanel
                                        isLoading={watchlistQuery.isLoading}
                                    />
                                </div>
                            )}
                            {rightPanelTab === "analysis" && (
                                <div className="space-y-4">
                                    <StockComparison
                                        quotes={quotesRecord}
                                        watchlist={activeWatchlist}
                                        isLoading={quotesQuery.isLoading}
                                    />
                                    <CorrelationMatrix
                                        quotes={quotesRecord}
                                        watchlist={activeWatchlist}
                                        isLoading={quotesQuery.isLoading}
                                    />
                                    <ValuationMetrics
                                        quotes={quotesRecord}
                                        watchlist={activeWatchlist}
                                        isLoading={quotesQuery.isLoading}
                                    />
                                </div>
                            )}
                            {rightPanelTab === "technical" && (
                                <TechnicalIndicators
                                    quotes={quotesRecord}
                                    watchlist={activeWatchlist}
                                    isLoading={quotesQuery.isLoading}
                                />
                            )}
                            {rightPanelTab === "news" && (
                                <NewsAndSentiment watchlist={activeWatchlist} />
                            )}
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
            `}</style>
        </TerminalLayout>
    );
}

