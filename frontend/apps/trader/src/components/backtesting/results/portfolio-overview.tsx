"use client";

import type { PortfolioMetrics } from "@trader/types";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    BarChart2,
    Target,
    Shield,
    Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface PortfolioOverviewProps {
    metrics: PortfolioMetrics;
    capital: number;
}

export function PortfolioOverview({
    metrics,
    capital,
}: PortfolioOverviewProps) {
    const finalBalance = capital + metrics.total_pnl;
    const isPositive = metrics.portfolio_return_pct >= 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                icon={isPositive ? TrendingUp : TrendingDown}
                label="Portfolio Return"
                value={`${
                    isPositive ? "+" : ""
                }${metrics.portfolio_return_pct.toFixed(2)}%`}
                isPositive={isPositive}
            />
            <MetricCard
                icon={DollarSign}
                label="Total P&L"
                value={`${metrics.total_pnl > 0 ? "+" : ""}₹${Math.abs(
                    metrics.total_pnl
                ).toLocaleString("en-IN")}`}
                subValue={`Final: ₹${finalBalance.toLocaleString("en-IN")}`}
                isPositive={metrics.total_pnl >= 0}
            />
            <MetricCard
                icon={Activity}
                label="Win Rate"
                value={`${metrics.avg_win_rate_pct.toFixed(1)}%`}
                subValue={`${metrics.total_trades} trades`}
            />
            <MetricCard
                icon={BarChart2}
                label="Sharpe Ratio"
                value={metrics.avg_sharpe_ratio.toFixed(2)}
                subValue={`${metrics.profitable_tickers}/${metrics.total_tickers} profitable`}
                isPositive={metrics.avg_sharpe_ratio >= 0}
            />

            {/* Second Row - Additional Metrics */}
            <MetricCard
                icon={Target}
                label="Max Drawdown"
                value={`${metrics.avg_max_drawdown_pct.toFixed(2)}%`}
                isPositive={false}
            />
            <MetricCard
                icon={Shield}
                label="Robustness Score"
                value={`${metrics.robustness_score.toFixed(1)}/100`}
                isPositive={metrics.robustness_score >= 50}
            />
            <MetricCard
                icon={Percent}
                label="Profitable Tickers"
                value={`${metrics.profitable_tickers}/${metrics.total_tickers}`}
                subValue={`${(
                    (metrics.profitable_tickers / metrics.total_tickers) *
                    100
                ).toFixed(0)}% success`}
                isPositive={
                    metrics.profitable_tickers > metrics.total_tickers / 2
                }
            />
            <MetricCard
                icon={Activity}
                label="Total Trades"
                value={metrics.total_trades.toString()}
                subValue="Across all tickers"
            />
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    subValue,
    isPositive,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    subValue?: string;
    isPositive?: boolean;
}) {
    return (
        <Card className="bg-[#12141a] border-[#2d303a]/50">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs text-[#8b8f9a] mb-1">{label}</p>
                        <p
                            className={cn(
                                "text-2xl font-bold font-mono",
                                isPositive !== undefined
                                    ? isPositive
                                        ? "text-[#3dd68c]"
                                        : "text-[#f06c6c]"
                                    : "text-[#e8eaed]"
                            )}
                        >
                            {value}
                        </p>
                        {subValue && (
                            <p className="text-xs text-[#8b8f9a] mt-1">
                                {subValue}
                            </p>
                        )}
                    </div>
                    <div className="p-2 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
                        <Icon className="h-4 w-4 text-[#6c8cff]" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

