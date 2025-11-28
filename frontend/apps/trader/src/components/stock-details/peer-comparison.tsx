"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { Users, TrendingUp, TrendingDown, ExternalLink, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PeerStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  pe?: number;
}

interface PeerComparisonProps {
  symbol: string;
}

async function fetchPeers(symbol: string) {
  const response = await fetch(`/api/peers?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch peers");
  return response.json();
}

async function fetchPeerQuotes(symbols: string[]): Promise<PeerStock[]> {
  const quotes = await Promise.all(
    symbols.map(async (s): Promise<PeerStock | null> => {
      try {
        const response = await fetch(`/api/quote?symbol=${s}`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
          symbol: s,
          name: data.name || s,
          price: data.price || data.lastPrice || 0,
          change: data.change || 0,
          changePercent: data.changesPercentage || data.changePercent || 0,
          marketCap: data.marketCap,
          pe: data.pe,
        };
      } catch {
        return null;
      }
    })
  );
  return quotes.filter((q): q is PeerStock => q !== null);
}

// Mock peer data for fallback
function getMockPeers(symbol: string): PeerStock[] {
  const peerGroups: Record<string, PeerStock[]> = {
    AAPL: [
      { symbol: "MSFT", name: "Microsoft Corp", price: 378.92, change: 2.45, changePercent: 0.65, marketCap: 2810000000000, pe: 35.2 },
      { symbol: "GOOGL", name: "Alphabet Inc", price: 141.80, change: -1.23, changePercent: -0.86, marketCap: 1770000000000, pe: 24.5 },
      { symbol: "META", name: "Meta Platforms", price: 505.75, change: 8.32, changePercent: 1.67, marketCap: 1290000000000, pe: 28.1 },
      { symbol: "AMZN", name: "Amazon.com Inc", price: 178.25, change: 3.18, changePercent: 1.82, marketCap: 1860000000000, pe: 62.3 },
    ],
    TSLA: [
      { symbol: "F", name: "Ford Motor Co", price: 11.52, change: -0.18, changePercent: -1.54, marketCap: 46000000000, pe: 11.2 },
      { symbol: "GM", name: "General Motors", price: 35.80, change: 0.45, changePercent: 1.27, marketCap: 49000000000, pe: 5.1 },
      { symbol: "RIVN", name: "Rivian Automotive", price: 16.25, change: 0.82, changePercent: 5.32, marketCap: 15000000000, pe: -2.3 },
      { symbol: "LCID", name: "Lucid Group Inc", price: 3.45, change: -0.12, changePercent: -3.36, marketCap: 7800000000, pe: -1.2 },
    ],
    NVDA: [
      { symbol: "AMD", name: "Advanced Micro", price: 148.30, change: 3.25, changePercent: 2.24, marketCap: 239000000000, pe: 45.2 },
      { symbol: "INTC", name: "Intel Corporation", price: 31.20, change: -0.85, changePercent: -2.65, marketCap: 132000000000, pe: 18.5 },
      { symbol: "TSM", name: "Taiwan Semi", price: 142.50, change: 1.90, changePercent: 1.35, marketCap: 740000000000, pe: 22.8 },
      { symbol: "QCOM", name: "QUALCOMM Inc", price: 168.45, change: 2.12, changePercent: 1.27, marketCap: 188000000000, pe: 19.4 },
    ],
  };

  // Return matching peers or generate random ones
  if (peerGroups[symbol]) return peerGroups[symbol];

  // Generate mock peers for unknown symbols
  const mockSymbols = ["PEER1", "PEER2", "PEER3", "PEER4"];
  return mockSymbols.map((s, i) => ({
    symbol: s,
    name: `Peer Company ${i + 1}`,
    price: 50 + Math.random() * 200,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    marketCap: Math.random() * 500000000000,
    pe: 10 + Math.random() * 40,
  }));
}

function formatMarketCap(value?: number): string {
  if (!value) return "-";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

// Mini sparkline component
function MiniSparkline({ positive }: { positive: boolean }) {
  const points = Array.from({ length: 20 }, (_, i) => {
    const trend = positive ? i * 0.5 : -i * 0.3;
    return 20 + trend + (Math.random() - 0.5) * 8;
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * 3} ${40 - p}`)
    .join(" ");

  return (
    <svg width="60" height="24" className="opacity-50">
      <path
        d={pathData}
        fill="none"
        stroke={positive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PeerComparison({ symbol }: PeerComparisonProps) {
  const { data: peersData, isLoading: peersLoading } = useQuery({
    queryKey: ["peers", symbol],
    queryFn: () => fetchPeers(symbol),
    staleTime: 86400000, // 24 hours
  });

  const peerSymbols = peersData?.peers?.slice(0, 5) || [];

  const { data: peerQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["peerQuotes", peerSymbols],
    queryFn: () => fetchPeerQuotes(peerSymbols),
    enabled: peerSymbols.length > 0,
    staleTime: 60000, // 1 minute
  });

  const isLoading = peersLoading || quotesLoading;

  // Use mock data if no real data available
  const peers = peerQuotes?.length ? peerQuotes : getMockPeers(symbol);

  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        <div className="h-6 bg-[#1e2028] rounded w-1/3 animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-[#1e2028] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Calculate comparison metrics
  const avgChange = peers.reduce((acc, p) => acc + p.changePercent, 0) / peers.length;
  const sectorTrend = avgChange > 0 ? "outperforming" : "underperforming";

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8eaed] flex items-center gap-2">
          <Users className="h-4 w-4 text-[#6c8cff]" />
          Peer Comparison
        </h3>
        <span className={cn(
          "text-[11px] px-2.5 py-1 rounded-lg font-medium",
          avgChange >= 0 ? "bg-[#22c55e]/12 text-[#3dd68c]" : "bg-[#ef4444]/12 text-[#f06c6c]"
        )}>
          Sector {sectorTrend}
        </span>
      </div>

      {/* Sector Average */}
      <div className="p-3.5 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8b8f9a]">Peer Avg. Performance</span>
          <span className={cn(
            "text-sm font-bold",
            avgChange >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
          )}>
            {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Peer List */}
      <div className="space-y-2">
        {peers.map((peer) => (
          <Link
            key={peer.symbol}
            href={`/stock/${peer.symbol}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1d24]/50 border border-transparent hover:bg-[#1e2028] hover:border-[#2d303a]/40 transition-all duration-200 group"
          >
            {/* Symbol & Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#e8eaed]">
                  {peer.symbol}
                </span>
                <ChevronRight className="h-3 w-3 text-[#8b8f9a] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-[#8b8f9a] truncate">
                {peer.name}
              </p>
            </div>

            {/* Mini Chart */}
            <div className="flex-shrink-0">
              <MiniSparkline positive={peer.changePercent >= 0} />
            </div>

            {/* Price & Change */}
            <div className="text-right flex-shrink-0 w-24">
              <p className="text-sm font-mono font-semibold text-[#c0c4cc]">
                ${peer.price.toFixed(2)}
              </p>
              <p className={cn(
                "text-xs font-medium flex items-center justify-end gap-0.5",
                peer.changePercent >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
              )}>
                {peer.changePercent >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {peer.changePercent >= 0 ? "+" : ""}{peer.changePercent.toFixed(2)}%
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="mt-4 pt-4 border-t border-[#2d303a]/40">
        <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wider mb-3">
          Key Metrics Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#8b8f9a]">
                <th className="text-left py-2 font-medium">Symbol</th>
                <th className="text-right py-2 font-medium">Mkt Cap</th>
                <th className="text-right py-2 font-medium">P/E</th>
                <th className="text-right py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((peer) => (
                <tr key={peer.symbol} className="border-t border-[#2d303a]/30">
                  <td className="py-2.5 font-semibold text-[#e8eaed]">{peer.symbol}</td>
                  <td className="py-2.5 text-right text-[#8b8f9a] font-mono">
                    {formatMarketCap(peer.marketCap)}
                  </td>
                  <td className="py-2.5 text-right text-[#8b8f9a] font-mono">
                    {peer.pe ? peer.pe.toFixed(1) : "-"}
                  </td>
                  <td className={cn(
                    "py-2.5 text-right font-mono font-medium",
                    peer.changePercent >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
                  )}>
                    {peer.changePercent >= 0 ? "+" : ""}{peer.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
