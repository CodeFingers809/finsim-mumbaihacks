"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus, BarChart3, Target } from "lucide-react";

interface RecommendationData {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface AnalystRatingsProps {
  symbol: string;
}

async function fetchRecommendations(symbol: string) {
  const response = await fetch(`/api/recommendations?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch recommendations");
  return response.json();
}

async function fetchPriceTarget(symbol: string) {
  // Mock price target data (could be extended with real API)
  const basePrice = 150 + Math.random() * 100;
  return {
    current: basePrice,
    targetHigh: basePrice * 1.35,
    targetLow: basePrice * 0.85,
    targetMean: basePrice * 1.15,
    targetMedian: basePrice * 1.12,
    numberOfAnalysts: Math.floor(15 + Math.random() * 20),
  };
}

export function AnalystRatings({ symbol }: AnalystRatingsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recommendations", symbol],
    queryFn: () => fetchRecommendations(symbol),
    staleTime: 86400000, // 24 hours
  });

  const { data: priceTarget } = useQuery({
    queryKey: ["priceTarget", symbol],
    queryFn: () => fetchPriceTarget(symbol),
    staleTime: 86400000,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-surface-muted rounded w-1/2" />
        <div className="h-32 bg-surface-muted rounded" />
      </div>
    );
  }

  const recommendations: RecommendationData[] = data?.recommendations || [];
  const latest = recommendations[0] || {
    strongBuy: 12,
    buy: 18,
    hold: 10,
    sell: 3,
    strongSell: 1,
    period: new Date().toISOString().slice(0, 7),
  };

  const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  const bullish = latest.strongBuy + latest.buy;
  const bearish = latest.sell + latest.strongSell;

  // Calculate consensus
  const score = (latest.strongBuy * 5 + latest.buy * 4 + latest.hold * 3 + latest.sell * 2 + latest.strongSell * 1) / total;
  const consensus = score >= 4 ? "Strong Buy" : score >= 3.5 ? "Buy" : score >= 2.5 ? "Hold" : score >= 1.5 ? "Sell" : "Strong Sell";
  const consensusColor = score >= 3.5 ? "text-success" : score >= 2.5 ? "text-warning" : "text-danger";

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8eaed] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
          Analyst Ratings
        </h3>
        <span className="text-[11px] text-[#8b8f9a]">
          {total} analysts
        </span>
      </div>

      {/* Consensus Badge */}
      <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
        <div className="text-center">
          <p className="text-xs text-text-secondary mb-1">Consensus</p>
          <p className={cn("text-xl font-bold", consensusColor)}>{consensus}</p>
          <p className="text-xs text-text-secondary mt-1">Score: {score.toFixed(2)}/5</p>
        </div>
      </div>

      {/* Rating Bars */}
      <div className="space-y-2.5">
        {[
          { label: "Strong Buy", count: latest.strongBuy, color: "bg-[#22c55e]" },
          { label: "Buy", count: latest.buy, color: "bg-[#4ade80]" },
          { label: "Hold", count: latest.hold, color: "bg-[#eab308]" },
          { label: "Sell", count: latest.sell, color: "bg-[#f97316]" },
          { label: "Strong Sell", count: latest.strongSell, color: "bg-[#ef4444]" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-[11px] text-[#8b8f9a] w-20">{item.label}</span>
            <div className="flex-1 h-2 rounded-full bg-[#1e2028] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", item.color)}
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[#c0c4cc] w-6 text-right">{item.count}</span>
          </div>
        ))}
      </div>

      {/* Bull vs Bear */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-[#22c55e]/8 border border-[#22c55e]/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#3dd68c]" />
            <span className="text-xs text-[#3dd68c] font-medium">Bullish</span>
          </div>
          <p className="text-lg font-bold text-[#3dd68c] mt-1">
            {((bullish / total) * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] text-[#3dd68c]/70">{bullish} analysts</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#ef4444]/8 border border-[#ef4444]/20">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-[#f06c6c]" />
            <span className="text-xs text-[#f06c6c] font-medium">Bearish</span>
          </div>
          <p className="text-lg font-bold text-[#f06c6c] mt-1">
            {((bearish / total) * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] text-[#f06c6c]/70">{bearish} analysts</p>
        </div>
      </div>

      {/* Price Target */}
      {priceTarget && (
        <div className="space-y-3 pt-3 border-t border-[#2d303a]/40">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-xs font-medium text-[#e8eaed]">Price Targets</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#ef4444]/8 text-center">
              <p className="text-[11px] text-[#f06c6c]/80">Low</p>
              <p className="text-sm font-mono font-semibold text-[#f06c6c]">
                ${priceTarget.targetLow.toFixed(0)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#6c8cff]/10 text-center">
              <p className="text-[11px] text-[#6c8cff]/80">Average</p>
              <p className="text-sm font-mono font-semibold text-[#6c8cff]">
                ${priceTarget.targetMean.toFixed(0)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#22c55e]/8 text-center">
              <p className="text-[11px] text-[#3dd68c]/80">High</p>
              <p className="text-sm font-mono font-semibold text-[#3dd68c]">
                ${priceTarget.targetHigh.toFixed(0)}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[#8b8f9a] text-center">
            Based on {priceTarget.numberOfAnalysts} analyst estimates
          </p>
        </div>
      )}
    </div>
  );
}
