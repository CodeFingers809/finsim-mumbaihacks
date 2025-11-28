"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PortfolioSummaryVisualProps {
  quotes: Record<string, MarketQuote>;
  watchlist?: Watchlist;
}

export function PortfolioSummaryVisual({ quotes, watchlist }: PortfolioSummaryVisualProps) {
  if (!watchlist || watchlist.stocks.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-6 text-center">
        <PieChart className="h-8 w-8 mx-auto mb-2 text-[#6c8cff] opacity-50" />
        <p className="text-sm text-[#8b8f9a]">Add stocks to your watchlist to see portfolio summary</p>
      </div>
    );
  }

  const stocksWithQuotes = watchlist.stocks
    .map((stock) => ({
      symbol: stock.symbol,
      quote: quotes[stock.symbol],
    }))
    .filter((item) => item.quote && typeof item.quote.lastPrice === "number");

  if (stocksWithQuotes.length === 0) {
    return null;
  }

  // Calculate portfolio metrics
  const totalValue = stocksWithQuotes.reduce((sum, s) => sum + (s.quote.lastPrice || 0), 0);
  const avgChange = stocksWithQuotes.reduce((sum, s) => sum + (s.quote.changePercent || 0), 0) / stocksWithQuotes.length;
  const positiveStocks = stocksWithQuotes.filter(s => (s.quote.changePercent || 0) >= 0).length;
  const negativeStocks = stocksWithQuotes.length - positiveStocks;
  const positivePercentage = (positiveStocks / stocksWithQuotes.length) * 100;
  const totalVolume = stocksWithQuotes.reduce((sum, s) => sum + (s.quote.volume || 0), 0);
  
  // Health score based on positive stocks ratio
  const healthScore = positivePercentage;
  
  // Market sentiment
  const sentiment = avgChange > 2 ? "Bullish" : avgChange < -2 ? "Bearish" : "Neutral";

  // Best and worst performers
  const sortedByChange = [...stocksWithQuotes].sort((a, b) => (b.quote.changePercent || 0) - (a.quote.changePercent || 0));
  const bestPerformer = sortedByChange[0];
  const worstPerformer = sortedByChange[sortedByChange.length - 1];
  const mostActive = [...stocksWithQuotes].sort((a, b) => (b.quote.volume || 0) - (a.quote.volume || 0))[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-sm font-semibold text-[#e8eaed]">Portfolio Summary</h3>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
          avgChange >= 0 ? "bg-[#3dd68c]/15" : "bg-[#f06c6c]/15"
        )}>
          {avgChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-[#3dd68c]" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[#f06c6c]" />
          )}
          <span className={cn(
            "text-sm font-bold font-mono",
            avgChange >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
          )}>
            {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Health Score */}
        <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-[10px] text-[#8b8f9a] uppercase tracking-wider">Health Score</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#2d303a" strokeWidth="3" />
                <circle 
                  cx="18" cy="18" r="15" fill="none" 
                  stroke={healthScore > 70 ? "#3dd68c" : healthScore > 40 ? "#eab308" : "#f06c6c"}
                  strokeWidth="3"
                  strokeDasharray={`${healthScore} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold font-mono text-[#e8eaed]">{healthScore.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-[#e8eaed]">{sentiment}</p>
              <p className="text-[10px] text-[#8b8f9a]">{positiveStocks} up, {negativeStocks} down</p>
            </div>
          </div>
        </div>

        {/* Total Stocks */}
        <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-[10px] text-[#8b8f9a] uppercase tracking-wider">Total Stocks</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#e8eaed] mb-2">{stocksWithQuotes.length}</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="h-1.5 bg-[#3dd68c]/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#3dd68c] rounded-full"
                  style={{ width: `${(positiveStocks / stocksWithQuotes.length) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-[#3dd68c] mt-1">{positiveStocks} ↑</p>
            </div>
            <div className="flex-1">
              <div className="h-1.5 bg-[#f06c6c]/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#f06c6c] rounded-full"
                  style={{ width: `${(negativeStocks / stocksWithQuotes.length) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-[#f06c6c] mt-1">{negativeStocks} ↓</p>
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-[10px] text-[#8b8f9a] uppercase tracking-wider">Total Volume</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#e8eaed]">
            {(totalVolume / 1000000).toFixed(1)}M
          </p>
          <p className="text-[10px] text-[#8b8f9a] mt-1">Most Active: {mostActive?.symbol}</p>
        </div>

        {/* Portfolio Value */}
        <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-[10px] text-[#8b8f9a] uppercase tracking-wider">Combined Value</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#e8eaed]">
            ₹{(totalValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-[#8b8f9a] mt-1">Avg: ₹{(totalValue / stocksWithQuotes.length).toFixed(2)}</p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex gap-3 text-[10px] text-[#8b8f9a] flex-wrap">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
          <div className="h-2 w-2 rounded-full bg-[#3dd68c]" />
          <span>Best: {bestPerformer?.symbol} ({bestPerformer?.quote.changePercent?.toFixed(2)}%)</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
          <div className="h-2 w-2 rounded-full bg-[#f06c6c]" />
          <span>Worst: {worstPerformer?.symbol} ({worstPerformer?.quote.changePercent?.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  );
}
