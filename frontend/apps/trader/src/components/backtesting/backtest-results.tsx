"use client";

import type { BacktestResponse } from "@trader/types";
import { BarChart2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
    PortfolioOverview,
    TickerResults,
    EquityCurveChart,
    AIAnalysis,
    StrategyCode,
    ComparisonCharts,
} from "./results";

interface BacktestResultsProps {
    result?: BacktestResponse | null;
    capital?: number;
}

export function BacktestResults({
    result,
    capital = 50000,
}: BacktestResultsProps) {
    if (!result) {
        return (
            <Card className="bg-[#12141a] border-[#2d303a]/50">
                <CardHeader className="border-b border-[#2d303a]/40">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-[#6c8cff]" />
                        <CardTitle className="text-[#e8eaed]">
                            Backtest Results
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-[#1a1d24] border border-[#2d303a]/50">
                            <BarChart2 className="h-8 w-8 text-[#8b8f9a]" />
                        </div>
                        <p className="text-sm text-[#8b8f9a]">
                            Run a backtest to see detailed charts and
                            performance metrics.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show errors if any
    if (result.errors && result.errors.length > 0) {
        return (
            <div className="space-y-6">
                <Card className="bg-[#12141a] border-[#f06c6c]/30">
                    <CardHeader className="border-b border-[#2d303a]/40">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-[#f06c6c]" />
                            <CardTitle className="text-[#f06c6c]">
                                Backtest Errors
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ul className="space-y-2">
                            {result.errors.map((error, index) => (
                                <li
                                    key={index}
                                    className="text-sm text-[#f06c6c] bg-[#f06c6c]/10 px-4 py-2 rounded-lg"
                                >
                                    {error}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                {/* Still show results if we have any */}
                {result.portfolio_metrics &&
                    result.ticker_results.length > 0 && (
                        <ResultsContent result={result} capital={capital} />
                    )}
            </div>
        );
    }

    return <ResultsContent result={result} capital={capital} />;
}

function ResultsContent({
    result,
    capital,
}: {
    result: BacktestResponse;
    capital: number;
}) {
    return (
        <div className="space-y-6">
            {/* Portfolio Overview Cards */}
            <PortfolioOverview
                metrics={result.portfolio_metrics}
                capital={capital}
            />

            {/* AI Analysis */}
            {result.analysis && <AIAnalysis analysis={result.analysis} />}

            {/* Equity Curve */}
            {result.equity_curve && result.equity_curve.length > 0 && (
                <EquityCurveChart
                    data={result.equity_curve}
                    capital={capital * result.portfolio_metrics.total_tickers}
                />
            )}

            {/* Comparison Charts */}
            <ComparisonCharts results={result.ticker_results} />

            {/* Individual Ticker Results */}
            <TickerResults results={result.ticker_results} />

            {/* Strategy Code */}
            {result.strategy_code && (
                <StrategyCode code={result.strategy_code} />
            )}
        </div>
    );
}

