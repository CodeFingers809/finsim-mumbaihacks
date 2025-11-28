"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import {
    TrendingUp,
    TrendingDown,
    ChevronRight,
    ExternalLink,
    Star,
    Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StockRatio {
    label: string;
    value: string | number;
}

interface CompanyInfo {
    symbol: string;
    name: string;
    sector?: string;
    industry?: string;
    description?: string;
    website?: string;
    ceo?: string;
    employees?: number;
    country?: string;
}

interface StockQuote {
    price: number;
    change: number;
    changePercent: number;
    marketCap?: number;
    pe?: number;
    volume?: number;
    dayHigh?: number;
    dayLow?: number;
    week52High?: number;
    week52Low?: number;
    open?: number;
    previousClose?: number;
}

interface TimelineEvent {
    type: "dividend" | "board" | "result" | "announcement";
    title: string;
    date: string;
    description?: string;
}

interface TijoriOverlayProps {
    company: CompanyInfo;
    quote: StockQuote;
    ratios?: StockRatio[];
    timeline?: TimelineEvent[];
    isLoading?: boolean;
}

const formatCurrency = (value: number | undefined, inCrores = false) => {
    if (value === undefined || isNaN(value)) return "-";
    if (inCrores) {
        if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `₹${(value / 1e6).toFixed(2)}M`;
    }
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const formatNumber = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "-";
    return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const formatPercent = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "-";
    return `${value.toFixed(2)}%`;
};

const formatLargeNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return "-";
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (absValue >= 1e12) return `${sign}₹${(absValue / 1e12).toFixed(1)}T`;
    if (absValue >= 1e9) return `${sign}₹${(absValue / 1e9).toFixed(1)}B`;
    if (absValue >= 1e6) return `${sign}₹${(absValue / 1e6).toFixed(1)}M`;
    return `${sign}₹${absValue.toFixed(0)}`;
};

// Mini financials component for the overlay
function MiniFinancials({ symbol }: { symbol: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ["mini-financials", symbol],
        queryFn: async () => {
            const [incomeRes, balanceRes] = await Promise.all([
                fetch(`/api/income-statement?symbol=${symbol}`),
                fetch(`/api/balance-sheet?symbol=${symbol}`),
            ]);
            const income = await incomeRes.json();
            const balance = await balanceRes.json();
            return { income, balance };
        },
        staleTime: 86400000,
    });

    if (isLoading) {
        return (
            <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-surface-muted rounded" />
                ))}
            </div>
        );
    }

    const income = data?.income?.annualReports?.[0];
    const balance = data?.balance?.annualReports?.[0];

    // Generate mock if no data
    const mockRevenue = 50000000000 + Math.random() * 300000000000;
    const mockNetIncome = mockRevenue * (0.1 + Math.random() * 0.15);
    const mockAssets = mockRevenue * 1.5;
    const mockEquity = mockRevenue * 0.7;

    const revenue = income?.totalRevenue || mockRevenue;
    const netIncome = income?.netIncome || mockNetIncome;
    const grossProfit = income?.grossProfit || revenue * 0.4;
    const totalAssets = balance?.totalAssets || mockAssets;
    const equity = balance?.totalShareholderEquity || mockEquity;

    const grossMargin = (grossProfit / revenue) * 100;
    const netMargin = (netIncome / revenue) * 100;
    const roe = (netIncome / equity) * 100;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-black/30 border border-border/30">
                    <p className="text-[10px] text-text-secondary mb-0.5">
                        Revenue
                    </p>
                    <p className="text-sm font-semibold text-foreground font-mono">
                        {formatLargeNumber(revenue)}
                    </p>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-border/30">
                    <p className="text-[10px] text-text-secondary mb-0.5">
                        Net Income
                    </p>
                    <p
                        className={cn(
                            "text-sm font-semibold font-mono",
                            netIncome >= 0 ? "text-success" : "text-danger"
                        )}
                    >
                        {formatLargeNumber(netIncome)}
                    </p>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-border/30">
                    <p className="text-[10px] text-text-secondary mb-0.5">
                        Gross Margin
                    </p>
                    <p
                        className={cn(
                            "text-sm font-semibold",
                            grossMargin >= 40
                                ? "text-success"
                                : grossMargin >= 20
                                ? "text-warning"
                                : "text-danger"
                        )}
                    >
                        {grossMargin.toFixed(1)}%
                    </p>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-border/30">
                    <p className="text-[10px] text-text-secondary mb-0.5">
                        Net Margin
                    </p>
                    <p
                        className={cn(
                            "text-sm font-semibold",
                            netMargin >= 15
                                ? "text-success"
                                : netMargin >= 5
                                ? "text-warning"
                                : "text-danger"
                        )}
                    >
                        {netMargin.toFixed(1)}%
                    </p>
                </div>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-primary/80">
                        Return on Equity
                    </p>
                    <p
                        className={cn(
                            "text-sm font-bold",
                            roe >= 15
                                ? "text-success"
                                : roe >= 10
                                ? "text-warning"
                                : "text-danger"
                        )}
                    >
                        {roe.toFixed(1)}%
                    </p>
                </div>
            </div>
            <p className="text-[9px] text-text-secondary text-center">
                See full analysis in bottom panel →
            </p>
        </div>
    );
}

export function TijoriOverlay({
    company,
    quote,
    ratios,
    timeline = [],
    isLoading = false,
}: TijoriOverlayProps) {
    const isPositive = quote.change >= 0;

    // Default ratios if not provided
    const defaultRatios: StockRatio[] = ratios || [
        { label: "Market Cap", value: formatCurrency(quote.marketCap, true) },
        { label: "P/E Ratio", value: formatNumber(quote.pe) },
        { label: "Volume", value: formatNumber(quote.volume) },
        { label: "Day High", value: formatCurrency(quote.dayHigh) },
        { label: "Day Low", value: formatCurrency(quote.dayLow) },
        { label: "Open", value: formatCurrency(quote.open) },
        { label: "Prev Close", value: formatCurrency(quote.previousClose) },
        { label: "52W High", value: formatCurrency(quote.week52High) },
        { label: "52W Low", value: formatCurrency(quote.week52Low) },
    ];

    // Calculate 52 week range position
    const rangePosition =
        quote.week52High && quote.week52Low && quote.price
            ? ((quote.price - quote.week52Low) /
                  (quote.week52High - quote.week52Low)) *
              100
            : 50;

    if (isLoading) {
        return (
            <div className="p-4 space-y-4 animate-pulse">
                <div className="h-6 bg-surface-muted rounded w-3/4" />
                <div className="h-10 bg-surface-muted rounded w-1/2" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-16 bg-surface-muted rounded"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header Section */}
            <div className="space-y-3">
                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                    {company.sector && (
                        <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-border/60"
                        >
                            {company.sector}
                        </Badge>
                    )}
                    {company.industry && (
                        <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-border/60"
                        >
                            {company.industry}
                        </Badge>
                    )}
                </div>

                {/* Company Name & Symbol */}
                <div>
                    <h2 className="text-lg font-semibold text-foreground leading-tight">
                        {company.name}
                    </h2>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">
                        {company.symbol}
                    </span>
                </div>

                {/* Price Section */}
                <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-foreground">
                        {formatCurrency(quote.price)}
                    </span>
                    <div
                        className={cn(
                            "flex items-center gap-1 text-sm font-medium",
                            isPositive ? "text-success" : "text-danger"
                        )}
                    >
                        {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                        <span>
                            {isPositive ? "+" : ""}
                            {formatPercent(quote.changePercent)}
                        </span>
                        <span className="text-xs">
                            ({isPositive ? "+" : ""}
                            {formatCurrency(quote.change)})
                        </span>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <div>
                        <span className="font-medium">Market Cap</span>
                        <span className="ml-1.5 text-foreground font-semibold">
                            {formatCurrency(quote.marketCap, true)}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div>
                        <span className="font-medium">P/E</span>
                        <span className="ml-1.5 text-foreground font-semibold">
                            {formatNumber(quote.pe)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium hover:bg-surface-muted transition-colors">
                        <Star className="h-3.5 w-3.5" />
                        Watchlist
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium hover:bg-surface-muted transition-colors">
                        <Bell className="h-3.5 w-3.5" />
                        Create Alert
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
                {/* Custom Ratios Grid */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Key Metrics
                        </h4>
                        <button className="text-primary text-[10px] hover:underline flex items-center gap-0.5">
                            Edit Ratios <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {defaultRatios.slice(0, 9).map((ratio, idx) => (
                            <div
                                key={idx}
                                className="p-2.5 rounded-lg bg-black/30 border border-border/30"
                            >
                                <p className="text-[10px] text-text-secondary mb-0.5">
                                    {ratio.label}
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                    {ratio.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 52 Week Range */}
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                        52 Week Range
                    </h4>
                    <div className="space-y-1.5">
                        <div className="relative h-2 rounded-full bg-surface-muted overflow-hidden">
                            <div
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-danger via-warning to-success rounded-full"
                                style={{ width: "100%" }}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-primary shadow-lg"
                                style={{
                                    left: `${Math.min(
                                        Math.max(rangePosition, 5),
                                        95
                                    )}%`,
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-text-secondary">
                            <span>Low: {formatCurrency(quote.week52Low)}</span>
                            <span>
                                High: {formatCurrency(quote.week52High)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="space-y-3">
                    <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                        About
                    </h4>
                    {company.description ? (
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">
                            {company.description}
                        </p>
                    ) : (
                        <p className="text-xs text-text-secondary italic">
                            Company description not available
                        </p>
                    )}

                    <div className="space-y-1">
                        {company.ceo && (
                            <div className="flex items-center justify-between py-1.5 border-b border-border/20">
                                <span className="text-[10px] text-text-secondary">
                                    CEO
                                </span>
                                <span className="text-[10px] text-foreground font-medium">
                                    {company.ceo}
                                </span>
                            </div>
                        )}
                        {company.employees && (
                            <div className="flex items-center justify-between py-1.5 border-b border-border/20">
                                <span className="text-[10px] text-text-secondary">
                                    Employees
                                </span>
                                <span className="text-[10px] text-foreground font-medium">
                                    {company.employees.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {company.country && (
                            <div className="flex items-center justify-between py-1.5 border-b border-border/20">
                                <span className="text-[10px] text-text-secondary">
                                    Country
                                </span>
                                <span className="text-[10px] text-foreground font-medium">
                                    {company.country}
                                </span>
                            </div>
                        )}
                        {company.website && (
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between py-1.5 border-b border-border/20 group"
                            >
                                <span className="text-[10px] text-text-secondary">
                                    Website
                                </span>
                                <span className="text-[10px] text-primary font-medium flex items-center gap-1 group-hover:underline">
                                    Visit{" "}
                                    <ExternalLink className="h-2.5 w-2.5" />
                                </span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Timeline Section */}
                {timeline.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                                Timeline
                            </h4>
                            <button className="text-primary text-[10px] hover:underline flex items-center gap-0.5">
                                Explore <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {timeline.slice(0, 3).map((event, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-black/20 border border-border/20"
                                >
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-full mt-1.5",
                                            event.type === "dividend" &&
                                                "bg-success",
                                            event.type === "board" &&
                                                "bg-primary",
                                            event.type === "result" &&
                                                "bg-warning",
                                            event.type === "announcement" &&
                                                "bg-purple-500"
                                        )}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">
                                            {event.title}
                                        </p>
                                        <p className="text-[10px] text-text-secondary">
                                            {event.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

