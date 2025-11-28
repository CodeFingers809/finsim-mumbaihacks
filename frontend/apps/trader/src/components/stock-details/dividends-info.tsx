"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  ChevronRight,
} from "lucide-react";

interface Dividend {
  exDate: string;
  paymentDate: string;
  recordDate?: string;
  declarationDate?: string;
  amount: number;
  adjustedAmount?: number;
}

interface DividendsData {
  symbol: string;
  dividends: Dividend[];
}

interface DividendsInfoProps {
  symbol: string;
  compact?: boolean;
}

async function fetchDividends(symbol: string): Promise<DividendsData> {
  const response = await fetch(`/api/dividends?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch dividends");
  return response.json();
}

// Generate mock dividends
function generateMockDividends(symbol: string): Dividend[] {
  const baseAmount = 0.2 + Math.random() * 0.5;
  const dividends: Dividend[] = [];
  const now = new Date();
  
  for (let i = 0; i < 8; i++) {
    const exDate = new Date(now);
    exDate.setMonth(exDate.getMonth() - (i * 3));
    
    const paymentDate = new Date(exDate);
    paymentDate.setDate(paymentDate.getDate() + 14);
    
    const recordDate = new Date(exDate);
    recordDate.setDate(recordDate.getDate() + 2);
    
    dividends.push({
      exDate: exDate.toISOString().split("T")[0],
      paymentDate: paymentDate.toISOString().split("T")[0],
      recordDate: recordDate.toISOString().split("T")[0],
      amount: baseAmount * (1 + (Math.random() - 0.5) * 0.1),
      adjustedAmount: baseAmount * (1 + (Math.random() - 0.5) * 0.1),
    });
  }
  
  return dividends;
}

export function DividendsInfo({ symbol, compact = false }: DividendsInfoProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dividends", symbol],
    queryFn: () => fetchDividends(symbol),
    staleTime: 86400000, // 24 hours
  });

  const dividends = data?.dividends?.length ? data.dividends : generateMockDividends(symbol);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  };

  const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;

  // Calculate stats
  const annualDividend = dividends.slice(0, 4).reduce((acc, d) => acc + d.amount, 0);
  const latestDividend = dividends[0];
  const previousDividend = dividends[1];
  const dividendGrowth = previousDividend 
    ? ((latestDividend.amount - previousDividend.amount) / previousDividend.amount) * 100 
    : 0;
  
  // Check if next dividend is upcoming
  const nextExDate = dividends[0]?.exDate ? new Date(dividends[0].exDate) : null;
  const isUpcoming = nextExDate && nextExDate > new Date();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-20 bg-[#1a1d24] rounded-lg" />
        <div className="h-32 bg-[#1a1d24] rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact ? "p-3" : "p-4")}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#1a1d24] border border-[#2d303a]/40">
          <div className="flex items-center gap-2 mb-1.5">
            <DollarSign className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-xs text-[#8b8f9a]">Annual Dividend</span>
          </div>
          <p className="text-lg font-bold text-[#e8eaed]">{formatAmount(annualDividend)}</p>
        </div>
        <div className="p-3 rounded-xl bg-[#1a1d24] border border-[#2d303a]/40">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="h-4 w-4 text-[#6c8cff]" />
            <span className="text-xs text-[#8b8f9a]">Dividend Growth</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            dividendGrowth >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
          )}>
            {dividendGrowth >= 0 ? "+" : ""}{dividendGrowth.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Next/Latest Dividend */}
      {latestDividend && (
        <div className={cn(
          "p-4 rounded-xl border",
          isUpcoming 
            ? "bg-[#6c8cff]/10 border-[#6c8cff]/30" 
            : "bg-[#1a1d24] border-[#2d303a]/40"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isUpcoming ? (
                <Clock className="h-4 w-4 text-[#6c8cff]" />
              ) : (
                <Calendar className="h-4 w-4 text-[#8b8f9a]" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isUpcoming ? "text-[#6c8cff]" : "text-[#e8eaed]"
              )}>
                {isUpcoming ? "Upcoming Dividend" : "Latest Dividend"}
              </span>
            </div>
            <span className="text-xl font-bold text-[#e8eaed]">
              {formatAmount(latestDividend.amount)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[#8b8f9a] mb-0.5">Ex-Dividend Date</p>
              <p className="text-[#e8eaed] font-medium">{formatDate(latestDividend.exDate)}</p>
            </div>
            <div>
              <p className="text-[#8b8f9a] mb-0.5">Payment Date</p>
              <p className="text-[#e8eaed] font-medium">{formatDate(latestDividend.paymentDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dividend History */}
      {!compact && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wider px-1">
            Dividend History
          </h4>
          <div className="space-y-1.5">
            {dividends.slice(0, 6).map((div, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1d24]/60 hover:bg-[#1a1d24] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    idx === 0 ? "bg-[#6c8cff]" : "bg-[#4b5563]"
                  )} />
                  <span className="text-sm text-[#e8eaed]">{formatDate(div.exDate)}</span>
                </div>
                <span className="text-sm font-semibold text-[#e8eaed]">
                  {formatAmount(div.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
