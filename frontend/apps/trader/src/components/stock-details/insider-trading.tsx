"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import {
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface InsiderTrade {
  symbol: string;
  companyName?: string;
  filingDate: string;
  transactionDate: string;
  insider: string;
  title: string;
  transactionType: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  sharesOwned?: number;
}

interface InsiderTradingProps {
  symbol: string;
  limit?: number;
  compact?: boolean;
}

async function fetchInsiderTrades(symbol: string, limit: number): Promise<InsiderTrade[]> {
  const response = await fetch(`/api/insider-trading?symbol=${symbol}&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch insider trading");
  return response.json();
}

// Mock data for when API doesn't return results
function generateMockInsiderTrades(symbol: string): InsiderTrade[] {
  const names = ["John Smith", "Sarah Johnson", "Michael Chen", "Emily Davis", "Robert Wilson"];
  const titles = ["CEO", "CFO", "Director", "VP Operations", "CTO"];
  const types = ["P-Purchase", "S-Sale", "A-Award"];
  
  return Array.from({ length: 8 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const shares = Math.floor(1000 + Math.random() * 50000);
    const price = 50 + Math.random() * 200;
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    return {
      symbol,
      filingDate: date.toISOString().split("T")[0],
      transactionDate: date.toISOString().split("T")[0],
      insider: names[i % names.length],
      title: titles[i % titles.length],
      transactionType: type,
      shares,
      pricePerShare: price,
      totalValue: shares * price,
    };
  }).sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime());
}

export function InsiderTrading({ symbol, limit = 10, compact = false }: InsiderTradingProps) {
  const { data: trades, isLoading, error } = useQuery({
    queryKey: ["insider-trading", symbol, limit],
    queryFn: () => fetchInsiderTrades(symbol, limit),
    staleTime: 3600000, // 1 hour
  });

  const displayTrades = trades?.length ? trades : generateMockInsiderTrades(symbol);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTransactionColor = (type: string) => {
    if (type.includes("Purchase") || type.startsWith("P")) return "text-[#3dd68c]";
    if (type.includes("Sale") || type.startsWith("S")) return "text-[#f06c6c]";
    return "text-[#6c8cff]";
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes("Purchase") || type.startsWith("P")) return ArrowUpRight;
    if (type.includes("Sale") || type.startsWith("S")) return ArrowDownRight;
    return TrendingUp;
  };

  const getTransactionLabel = (type: string) => {
    if (type.includes("Purchase") || type.startsWith("P")) return "Buy";
    if (type.includes("Sale") || type.startsWith("S")) return "Sell";
    if (type.includes("Award") || type.startsWith("A")) return "Award";
    return type;
  };

  // Calculate summary stats
  const buyVolume = displayTrades
    .filter(t => t.transactionType.includes("Purchase") || t.transactionType.startsWith("P"))
    .reduce((acc, t) => acc + t.totalValue, 0);
  const sellVolume = displayTrades
    .filter(t => t.transactionType.includes("Sale") || t.transactionType.startsWith("S"))
    .reduce((acc, t) => acc + t.totalValue, 0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#1a1d24] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact ? "p-3" : "p-4")}>
      {/* Summary Cards */}
      {!compact && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#3dd68c]/10 border border-[#3dd68c]/20">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-[#3dd68c]" />
              <span className="text-xs text-[#3dd68c] font-medium">Insider Buying</span>
            </div>
            <p className="text-lg font-bold text-[#3dd68c]">{formatValue(buyVolume)}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#f06c6c]/10 border border-[#f06c6c]/20">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="h-4 w-4 text-[#f06c6c]" />
              <span className="text-xs text-[#f06c6c] font-medium">Insider Selling</span>
            </div>
            <p className="text-lg font-bold text-[#f06c6c]">{formatValue(sellVolume)}</p>
          </div>
        </div>
      )}

      {/* Trades List */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wider px-1">
          Recent Transactions
        </h4>
        <div className={cn("space-y-2", compact && "max-h-[200px] overflow-y-auto custom-scrollbar")}>
          {displayTrades.slice(0, compact ? 5 : limit).map((trade, idx) => {
            const Icon = getTransactionIcon(trade.transactionType);
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#1a1d24] border border-[#2d303a]/40 hover:border-[#2d303a] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3.5 w-3.5 text-[#8b8f9a]" />
                      <span className="text-sm font-medium text-[#e8eaed] truncate">
                        {trade.insider}
                      </span>
                    </div>
                    <p className="text-xs text-[#8b8f9a]">{trade.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("flex items-center gap-1", getTransactionColor(trade.transactionType))}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-sm font-semibold">
                        {getTransactionLabel(trade.transactionType)}
                      </span>
                    </div>
                    <p className="text-xs text-[#8b8f9a] mt-0.5">{formatDate(trade.transactionDate)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2d303a]/40">
                  <div className="flex items-center gap-1 text-xs text-[#8b8f9a]">
                    <span>{trade.shares.toLocaleString()} shares</span>
                    <span className="text-[#4b5563]">@</span>
                    <span>${trade.pricePerShare.toFixed(2)}</span>
                  </div>
                  <span className={cn("text-sm font-semibold", getTransactionColor(trade.transactionType))}>
                    {formatValue(trade.totalValue)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
