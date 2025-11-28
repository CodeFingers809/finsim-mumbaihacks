"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface EarningsEstimate {
  date: string;
  epsEstimate: number;
  epsActual?: number;
  revenueEstimate: number;
  revenueActual?: number;
  quarter: string;
  surprise?: number;
  surprisePercent?: number;
}

interface EarningsEstimatesProps {
  symbol: string;
  compact?: boolean;
}

// Generate mock earnings data
function generateMockEarnings(symbol: string): EarningsEstimate[] {
  const quarters = ["Q4 2024", "Q3 2024", "Q2 2024", "Q1 2024", "Q4 2023", "Q3 2023"];
  const baseEps = 1.5 + Math.random() * 2;
  const baseRevenue = 10000000000 + Math.random() * 50000000000;
  
  return quarters.map((quarter, idx) => {
    const isReported = idx > 0; // First one is upcoming
    const epsEstimate = baseEps * (1 + (Math.random() - 0.5) * 0.2) * (1 - idx * 0.02);
    const revenueEstimate = baseRevenue * (1 + (Math.random() - 0.5) * 0.1) * (1 - idx * 0.02);
    const epsActual = isReported ? epsEstimate * (1 + (Math.random() - 0.3) * 0.15) : undefined;
    const revenueActual = isReported ? revenueEstimate * (1 + (Math.random() - 0.3) * 0.08) : undefined;
    
    const date = new Date();
    date.setMonth(date.getMonth() - idx * 3);
    
    return {
      date: date.toISOString().split("T")[0],
      quarter,
      epsEstimate,
      epsActual,
      revenueEstimate,
      revenueActual,
      surprise: epsActual ? epsActual - epsEstimate : undefined,
      surprisePercent: epsActual ? ((epsActual - epsEstimate) / epsEstimate) * 100 : undefined,
    };
  });
}

export function EarningsEstimates({ symbol, compact = false }: EarningsEstimatesProps) {
  // In a real app, this would fetch from an API
  const earnings = generateMockEarnings(symbol);

  const formatRevenue = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const upcomingEarnings = earnings[0];
  const pastEarnings = earnings.slice(1);

  // Calculate beat/miss stats
  const beats = pastEarnings.filter(e => (e.surprise || 0) > 0).length;
  const misses = pastEarnings.filter(e => (e.surprise || 0) < 0).length;

  return (
    <div className={cn("space-y-4", compact ? "p-3" : "p-4")}>
      {/* Upcoming Earnings */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#6c8cff]/15 to-[#6c8cff]/5 border border-[#6c8cff]/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-sm font-medium text-[#6c8cff]">Next Earnings</span>
          </div>
          <span className="text-xs text-[#8b8f9a]">{upcomingEarnings.quarter}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#8b8f9a] mb-1">EPS Estimate</p>
            <p className="text-xl font-bold text-[#e8eaed]">
              ${upcomingEarnings.epsEstimate.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8b8f9a] mb-1">Revenue Est.</p>
            <p className="text-xl font-bold text-[#e8eaed]">
              {formatRevenue(upcomingEarnings.revenueEstimate)}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#6c8cff]/20 flex items-center gap-2 text-xs text-[#8b8f9a]">
          <Calendar className="h-3.5 w-3.5" />
          <span>Expected: {formatDate(upcomingEarnings.date)}</span>
        </div>
      </div>

      {/* Beat/Miss Summary */}
      {!compact && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#3dd68c]/10 border border-[#3dd68c]/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-[#3dd68c]" />
              <span className="text-xs text-[#3dd68c] font-medium">Beats</span>
            </div>
            <p className="text-2xl font-bold text-[#3dd68c]">{beats}</p>
            <p className="text-xs text-[#8b8f9a]">Last {pastEarnings.length} quarters</p>
          </div>
          <div className="p-3 rounded-xl bg-[#f06c6c]/10 border border-[#f06c6c]/20">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-[#f06c6c]" />
              <span className="text-xs text-[#f06c6c] font-medium">Misses</span>
            </div>
            <p className="text-2xl font-bold text-[#f06c6c]">{misses}</p>
            <p className="text-xs text-[#8b8f9a]">Last {pastEarnings.length} quarters</p>
          </div>
        </div>
      )}

      {/* Past Earnings */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wider px-1">
          Earnings History
        </h4>
        <div className={cn("space-y-2", compact && "max-h-[180px] overflow-y-auto custom-scrollbar")}>
          {pastEarnings.slice(0, compact ? 3 : 5).map((earning, idx) => {
            const isBeat = (earning.surprise || 0) > 0;
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#1a1d24] border border-[#2d303a]/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#e8eaed]">{earning.quarter}</span>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    isBeat 
                      ? "bg-[#3dd68c]/15 text-[#3dd68c]" 
                      : "bg-[#f06c6c]/15 text-[#f06c6c]"
                  )}>
                    {isBeat ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isBeat ? "Beat" : "Miss"} {Math.abs(earning.surprisePercent || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[#8b8f9a] mb-0.5">EPS</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[#e8eaed] font-semibold">
                        ${earning.epsActual?.toFixed(2)}
                      </span>
                      <span className="text-[#8b8f9a]">
                        vs ${earning.epsEstimate.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[#8b8f9a] mb-0.5">Revenue</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[#e8eaed] font-semibold">
                        {formatRevenue(earning.revenueActual || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
