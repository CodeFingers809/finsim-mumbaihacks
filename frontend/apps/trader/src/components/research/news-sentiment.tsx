"use client";

import { useState, useEffect } from "react";
import type { Watchlist } from "@trader/types";
import { Newspaper, TrendingUp, TrendingDown, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NewsItem {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  source: string;
  timestamp: string;
  url?: string;
  imageUrl?: string;
  author?: string;
}

interface NewsAndSentimentProps {
  watchlist?: Watchlist;
}

// Format timestamp to relative time
function formatTimestamp(isoTimestamp: string): string {
  const now = new Date();
  const timestamp = new Date(isoTimestamp);
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return timestamp.toLocaleDateString();
}

async function fetchNews(symbols: string[]): Promise<NewsItem[]> {
  const response = await fetch(`/api/news?symbols=${symbols.join(",")}`);
  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }
  return response.json();
}

export function NewsAndSentiment({ watchlist }: NewsAndSentimentProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedSentiment, setSelectedSentiment] = useState<"all" | "bullish" | "bearish" | "neutral">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    if (!watchlist || watchlist.stocks.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const symbols = watchlist.stocks.map((s) => s.symbol);
      const articles = await fetchNews(symbols);
      setNews(articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
      console.error("Error loading news:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [watchlist]);

  if (!watchlist || watchlist.stocks.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Newspaper className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">News & Sentiment</h3>
        </div>
        <p className="text-sm text-[#8b8f9a]">
          Add stocks to your watchlist to see relevant news
        </p>
      </div>
    );
  }

  const filteredNews = selectedSentiment === "all" 
    ? news 
    : news.filter(item => item.sentiment === selectedSentiment);

  const sentimentCounts = {
    bullish: news.filter(n => n.sentiment === "bullish").length,
    bearish: news.filter(n => n.sentiment === "bearish").length,
    neutral: news.filter(n => n.sentiment === "neutral").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">News & Sentiment</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[#1a1d24] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">News & Sentiment</h3>
        </div>
        <button
          onClick={loadNews}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-[#2d303a]/50 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-[#8b8f9a]", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Sentiment Filter Pills */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setSelectedSentiment("all")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors",
            selectedSentiment === "all"
              ? "bg-[#6c8cff]/20 text-[#6c8cff]"
              : "bg-[#2d303a]/30 text-[#8b8f9a] hover:bg-[#2d303a]/50"
          )}
        >
          All ({news.length})
        </button>
        <button
          onClick={() => setSelectedSentiment("bullish")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1",
            selectedSentiment === "bullish"
              ? "bg-[#3dd68c]/20 text-[#3dd68c]"
              : "bg-[#2d303a]/30 text-[#8b8f9a] hover:bg-[#2d303a]/50"
          )}
        >
          <TrendingUp className="h-3 w-3" />
          Bullish ({sentimentCounts.bullish})
        </button>
        <button
          onClick={() => setSelectedSentiment("bearish")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1",
            selectedSentiment === "bearish"
              ? "bg-[#f06c6c]/20 text-[#f06c6c]"
              : "bg-[#2d303a]/30 text-[#8b8f9a] hover:bg-[#2d303a]/50"
          )}
        >
          <TrendingDown className="h-3 w-3" />
          Bearish ({sentimentCounts.bearish})
        </button>
        <button
          onClick={() => setSelectedSentiment("neutral")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors",
            selectedSentiment === "neutral"
              ? "bg-[#8b8f9a]/20 text-[#e8eaed]"
              : "bg-[#2d303a]/30 text-[#8b8f9a] hover:bg-[#2d303a]/50"
          )}
        >
          Neutral ({sentimentCounts.neutral})
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#f06c6c]/30 bg-[#f06c6c]/10 p-3 text-xs text-[#f06c6c]">
          {error}
        </div>
      )}

      {/* Sentiment Summary */}
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-[#8b8f9a] mb-0.5">Bullish</p>
            <p className="text-base font-bold font-mono text-[#3dd68c]">{sentimentCounts.bullish}</p>
          </div>
          <div className="text-center border-x border-[#2d303a]/30">
            <p className="text-[10px] text-[#8b8f9a] mb-0.5">Neutral</p>
            <p className="text-base font-bold font-mono text-[#e8eaed]">{sentimentCounts.neutral}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[#8b8f9a] mb-0.5">Bearish</p>
            <p className="text-base font-bold font-mono text-[#f06c6c]">{sentimentCounts.bearish}</p>
          </div>
        </div>
      </div>

      {/* News Items */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {filteredNews.length === 0 ? (
          <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4 text-center">
            <p className="text-sm text-[#8b8f9a]">No news for selected sentiment</p>
          </div>
        ) : (
          filteredNews.map((item) => (
            <div
              key={item.id}
              onClick={() => item.url && window.open(item.url, "_blank")}
              className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3 cursor-pointer hover:border-[#2d303a]/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#2d303a]/50 text-[10px] font-medium text-[#e8eaed]">
                    {item.symbol}
                  </span>
                  {item.sentiment === "bullish" ? (
                    <TrendingUp className="h-3 w-3 text-[#3dd68c]" />
                  ) : item.sentiment === "bearish" ? (
                    <TrendingDown className="h-3 w-3 text-[#f06c6c]" />
                  ) : null}
                </div>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  item.sentiment === "bullish" && "bg-[#3dd68c]/15 text-[#3dd68c]",
                  item.sentiment === "bearish" && "bg-[#f06c6c]/15 text-[#f06c6c]",
                  item.sentiment === "neutral" && "bg-[#8b8f9a]/15 text-[#8b8f9a]"
                )}>
                  {item.sentiment}
                </span>
              </div>
              
              <h4 className="text-xs font-medium text-[#e8eaed] leading-tight mb-1.5 line-clamp-2">
                {item.title}
              </h4>
              <p className="text-[11px] text-[#8b8f9a] leading-relaxed mb-2 line-clamp-2">
                {item.summary}
              </p>
              
              <div className="flex items-center justify-between text-[10px] text-[#8b8f9a]">
                <span className="font-medium">{item.source}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                  {item.url && <ExternalLink className="h-2.5 w-2.5" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
