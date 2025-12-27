"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CandlestickData, HistogramData } from "lightweight-charts";

import {
    ConfigurableChart,
    ChartLayoutSelector,
    type ChartConfig,
    type ChartLayout,
} from "@/components/stock-details/configurable-chart";
import { TijoriOverlay } from "@/components/stock-details/tijori-overlay";
import { ChartToolbar } from "@/components/stock-details/trading-components";
import { AnalystRatings } from "@/components/stock-details/analyst-ratings";
import { StockNews } from "@/components/stock-details/stock-news";
import { TechnicalIndicators } from "@/components/stock-details/technical-indicators";
import { PeerComparison } from "@/components/stock-details/peer-comparison";
import { FinancialsPanel } from "@/components/stock-details/financials-panel";
import { InsiderTrading } from "@/components/stock-details/insider-trading";
import { DividendsInfo } from "@/components/stock-details/dividends-info";
import { EarningsEstimates } from "@/components/stock-details/earnings-estimates";
import type { MarketQuote } from "@trader/types";
import { cn } from "@/lib/utils/cn";
import {
    BarChart3,
    Newspaper,
    Activity,
    Users,
    DollarSign,
    UserCheck,
    Coins,
    TrendingUp,
} from "lucide-react";

// Types
interface CompanyProfile {
    symbol: string;
    companyName: string;
    sector?: string;
    industry?: string;
    description?: string;
    website?: string;
    ceo?: string;
    employees?: number;
    marketCap?: number;
    country?: string;
}

interface StockPageClientProps {
    symbol: string;
    initialQuote: MarketQuote;
    initialProfile: CompanyProfile;
    initialCandles: CandlestickData[];
    initialVolumes: HistogramData[];
}

// Fetch functions
async function fetchQuote(symbol: string): Promise<MarketQuote> {
    const response = await fetch(`/api/quote?symbol=${symbol}`);
    if (!response.ok) throw new Error("Failed to fetch quote");
    const data = await response.json();
    return {
        symbol: data.symbol,
        lastPrice: data.price || data.lastPrice || 0,
        change: data.change || 0,
        changePercent: data.changesPercentage || data.changePercent || 0,
        dayHigh: data.dayHigh || data.high || 0,
        dayLow: data.dayLow || data.low || 0,
        open: data.open || 0,
        volume: data.volume || 0,
        previousClose: data.previousClose || 0,
    };
}

async function fetchCompanyOverview(symbol: string) {
    const response = await fetch(`/api/company-overview?symbol=${symbol}`);
    if (!response.ok) throw new Error("Failed to fetch company overview");
    return response.json();
}

async function fetchChartData(symbol: string, timeframe: string = "1D") {
    const response = await fetch(
        `/api/historical-price?symbol=${symbol}&timeframe=${timeframe}`
    );
    if (!response.ok) throw new Error("Failed to fetch chart data");
    return response.json();
}

export function StockPageClient({
    symbol,
    initialQuote,
    initialProfile,
    initialCandles,
    initialVolumes,
}: StockPageClientProps) {
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [rightPanelTab, setRightPanelTab] = useState<
        "technicals" | "analysts" | "news" | "earnings"
    >("technicals");
    const [leftPanelTab, setLeftPanelTab] = useState<
        "overview" | "financials" | "insider" | "dividends"
    >("overview");
    const [timeframe, setTimeframe] = useState("1D");
    const [chartType, setChartType] = useState("candle");
    const [activeSymbol, setActiveSymbol] = useState(symbol);

    // Chart layout and configuration
    const [chartLayout, setChartLayout] =
        useState<ChartLayout>("split-vertical");
    const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([
        { id: "chart1", type: "candlestick", showVolume: true },
        { id: "chart2", type: "rsi", showVolume: false },
        { id: "chart3", type: "macd", showVolume: false },
        { id: "chart4", type: "volume", showVolume: false },
    ]);

    const updateChartConfig = (index: number, newConfig: ChartConfig) => {
        setChartConfigs((prev) => {
            const updated = [...prev];
            updated[index] = newConfig;
            return updated;
        });
    };

    // Real-time quote polling
    const quoteQuery = useQuery({
        queryKey: ["quote", activeSymbol],
        queryFn: () => fetchQuote(activeSymbol),
        initialData: initialQuote,
        refetchInterval: 5000, // Poll every 5 seconds
        staleTime: 3000,
    });

    // Company overview (less frequent updates)
    const overviewQuery = useQuery({
        queryKey: ["overview", activeSymbol],
        queryFn: () => fetchCompanyOverview(activeSymbol),
        staleTime: 86400000, // 24 hours
    });

    // Chart data (updates on timeframe change)
    const chartQuery = useQuery({
        queryKey: ["chart", activeSymbol, timeframe],
        queryFn: () => fetchChartData(activeSymbol, timeframe),
        staleTime: 60000, // 1 minute
    });

    // Process chart data
    const candles: CandlestickData[] = chartQuery.data?.length
        ? chartQuery.data.map((candle: any) => ({
              time: candle.date || candle.time,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
          }))
        : initialCandles;

    const volumes: HistogramData[] = chartQuery.data?.length
        ? chartQuery.data.map((candle: any) => ({
              time: candle.date || candle.time,
              value: candle.volume,
              color:
                  candle.close >= candle.open
                      ? "rgba(34,197,94,0.5)"
                      : "rgba(239,68,68,0.5)",
          }))
        : initialVolumes;

    // Prepare data for Tijori overlay
    const quote = quoteQuery.data;
    const overview = overviewQuery.data;

    const companyInfo = {
        symbol: activeSymbol,
        name: overview?.name || initialProfile.companyName || activeSymbol,
        sector: overview?.sector || initialProfile.sector,
        industry: overview?.industry || initialProfile.industry,
        description: overview?.description || initialProfile.description,
        website: overview?.website,
        ceo: overview?.ceo,
        employees: overview?.employees,
        country: overview?.country || initialProfile.country,
    };

    const quoteData = {
        price: quote?.lastPrice || 0,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0,
        marketCap: overview?.marketCapitalization,
        pe: overview?.peRatio,
        volume: quote?.volume,
        dayHigh: quote?.dayHigh,
        dayLow: quote?.dayLow,
        week52High: overview?.week52High,
        week52Low: overview?.week52Low,
        open: quote?.open,
        previousClose: quote?.previousClose,
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0c0d10] flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <ChartToolbar
                symbol={activeSymbol}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                chartType={chartType}
                onChartTypeChange={setChartType}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Section: Left Panel + Chart + Right Panel */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Info Panel Sidebar with ScrollArea */}
                    {showInfoPanel && (
                        <div className="w-[320px] lg:w-[360px] xl:w-[400px] border-r border-[#2d303a]/50 bg-[#12141a] flex flex-col overflow-hidden shrink-0">
                            {/* Tabs Header */}
                            <div className="px-3 py-2 border-b border-[#2d303a]/40">
                                <div className="flex justify-center gap-1 p-1 bg-[#1a1d24] rounded-lg overflow-x-auto custom-scrollbar">
                                    {[
                                        { id: "overview", label: "Overview" },
                                        {
                                            id: "financials",
                                            label: "Financials",
                                            icon: DollarSign,
                                        },
                                        {
                                            id: "insider",
                                            label: "Insider",
                                            icon: UserCheck,
                                        },
                                        {
                                            id: "dividends",
                                            label: "Dividends",
                                            icon: Coins,
                                        },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() =>
                                                setLeftPanelTab(tab.id as any)
                                            }
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 whitespace-nowrap",
                                                leftPanelTab === tab.id
                                                    ? "bg-[#6c8cff] text-white shadow-md"
                                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                                            )}
                                        >
                                            {tab.icon && (
                                                <tab.icon className="h-3 w-3" />
                                            )}
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {leftPanelTab === "overview" && (
                                    <TijoriOverlay
                                        company={companyInfo}
                                        quote={quoteData}
                                        isLoading={overviewQuery.isLoading}
                                    />
                                )}
                                {leftPanelTab === "financials" && (
                                    <div className="p-4">
                                        <FinancialsPanel
                                            symbol={activeSymbol}
                                        />
                                    </div>
                                )}
                                {leftPanelTab === "insider" && (
                                    <div className="p-4">
                                        <InsiderTrading
                                            symbol={activeSymbol}
                                            limit={10}
                                        />
                                    </div>
                                )}
                                {leftPanelTab === "dividends" && (
                                    <div className="p-4">
                                        <DividendsInfo symbol={activeSymbol} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chart Container */}
                    <div className="flex-1 flex flex-col bg-[#0c0d10] overflow-hidden">
                        {/* Charts Area with Layout Options */}
                        <div className="flex-1 flex flex-col min-h-0 relative">
                            {/* Layout Selector & Price Display */}
                            <div className="absolute top-3 right-3 z-30 flex items-center gap-3">
                                <ChartLayoutSelector
                                    layout={chartLayout}
                                    onLayoutChange={setChartLayout}
                                />
                                <div className="px-4 py-2 rounded-xl bg-[#12141a]/95 backdrop-blur-sm border border-[#2d303a]/50 shadow-soft">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold font-mono tracking-tight text-[#e8eaed]">
                                            ₹{quote?.lastPrice?.toFixed(2) || "--"}
                                        </span>
                                        <div
                                            className={cn(
                                                "flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-semibold",
                                                (quote?.change || 0) >= 0
                                                    ? "bg-[#3dd68c]/15 text-[#3dd68c]"
                                                    : "bg-[#f06c6c]/15 text-[#f06c6c]"
                                            )}
                                        >
                                            {(quote?.change || 0) >= 0
                                                ? "+"
                                                : ""}
                                            {quote?.change?.toFixed(2) || "--"}
                                            <span className="text-xs opacity-80">
                                                (
                                                {quote?.changePercent.toFixed(
                                                    2
                                                )}
                                                %)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Buttons */}
                            <div className="absolute left-3 bottom-3 flex items-center gap-2 z-40">
                                <button
                                    onClick={() =>
                                        setShowInfoPanel(!showInfoPanel)
                                    }
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200",
                                        showInfoPanel
                                            ? "bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]"
                                            : "bg-[#171921]/90 backdrop-blur-sm border-[#2d303a]/60 hover:bg-[#1e2028]"
                                    )}
                                >
                                    Info
                                </button>
                            </div>

                            {/* Dynamic Chart Layout */}
                            {chartLayout === "single" && (
                                <div className="flex-1 relative">
                                    <ConfigurableChart
                                        symbol={activeSymbol}
                                        data={candles}
                                        volume={volumes}
                                        currentPrice={quote?.lastPrice}
                                        config={chartConfigs[0]}
                                        onConfigChange={(c) =>
                                            updateChartConfig(0, c)
                                        }
                                    />
                                </div>
                            )}

                            {chartLayout === "split-vertical" && (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-[0.65] relative border-b border-[#2d303a]/30 min-h-[180px]">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[0]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(0, c)
                                            }
                                        />
                                    </div>
                                    <div className="flex-[0.35] relative min-h-[120px]">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[1]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(1, c)
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {chartLayout === "split-horizontal" && (
                                <div className="flex-1 flex">
                                    <div className="flex-1 relative border-r border-[#2d303a]/30">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[0]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(0, c)
                                            }
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[1]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(1, c)
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {chartLayout === "quad" && (
                                <div className="flex-1 grid grid-cols-2 grid-rows-2">
                                    <div className="relative border-r border-b border-[#2d303a]/30">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[0]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(0, c)
                                            }
                                        />
                                    </div>
                                    <div className="relative border-b border-[#2d303a]/30">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[1]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(1, c)
                                            }
                                        />
                                    </div>
                                    <div className="relative border-r border-[#2d303a]/30">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[2]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(2, c)
                                            }
                                        />
                                    </div>
                                    <div className="relative">
                                        <ConfigurableChart
                                            symbol={activeSymbol}
                                            data={candles}
                                            volume={volumes}
                                            currentPrice={quote?.lastPrice}
                                            config={chartConfigs[3]}
                                            onConfigChange={(c) =>
                                                updateChartConfig(3, c)
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Analysis Panel (moved from bottom) */}
                    <div className="w-[320px] lg:w-[360px] xl:w-[400px] bg-[#12141a] border-l border-[#2d303a]/50 flex flex-col shrink-0">
                        {/* Panel Header with Tabs */}
                        <div className="p-3 border-b border-[#2d303a]/40">
                            <div className="flex justify-center gap-1 p-1 bg-[#1a1d24] rounded-lg overflow-x-auto custom-scrollbar">
                                {[
                                    {
                                        id: "technicals",
                                        label: "Technicals",
                                        icon: Activity,
                                    },
                                    {
                                        id: "analysts",
                                        label: "Analysts",
                                        icon: BarChart3,
                                    },
                                    {
                                        id: "news",
                                        label: "News",
                                        icon: Newspaper,
                                    },
                                    {
                                        id: "earnings",
                                        label: "Earnings",
                                        icon: TrendingUp,
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() =>
                                            setRightPanelTab(tab.id as any)
                                        }
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 whitespace-nowrap",
                                            rightPanelTab === tab.id
                                                ? "bg-[#6c8cff] text-white shadow-md"
                                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                                        )}
                                    >
                                        <tab.icon className="h-3 w-3" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {rightPanelTab === "technicals" && (
                                <TechnicalIndicators
                                    symbol={activeSymbol}
                                    currentPrice={quote?.lastPrice}
                                />
                            )}
                            {rightPanelTab === "analysts" && (
                                <AnalystRatings symbol={activeSymbol} />
                            )}
                            {rightPanelTab === "news" && (
                                <StockNews symbol={activeSymbol} limit={10} />
                            )}
                            {rightPanelTab === "earnings" && (
                                <EarningsEstimates symbol={activeSymbol} />
                            )}
                        </div>
                    </div>
                </div>
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
        </div>
    );
}

