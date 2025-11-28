"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { Newspaper, ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Image from "next/image";

interface NewsArticle {
  symbol?: string;
  publishedDate: string;
  title: string;
  image?: string;
  site: string;
  text?: string;
  url: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface StockNewsProps {
  symbol: string;
  limit?: number;
  compact?: boolean;
}

async function fetchStockNews(symbol: string, limit: number = 10) {
  const response = await fetch(`/api/stock-news?symbol=${symbol}&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch news");
  return response.json();
}

// Simple sentiment analysis based on keywords
function analyzeSentiment(title: string, text?: string): "positive" | "negative" | "neutral" {
  const content = `${title} ${text || ""}`.toLowerCase();
  const positiveWords = ["surge", "rally", "gain", "rise", "beat", "growth", "upgrade", "bullish", "soar", "jump", "profit", "record"];
  const negativeWords = ["drop", "fall", "decline", "loss", "miss", "downgrade", "bearish", "crash", "plunge", "sink", "cut", "warn"];
  
  const positiveCount = positiveWords.filter(word => content.includes(word)).length;
  const negativeCount = negativeWords.filter(word => content.includes(word)).length;
  
  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SentimentIcon({ sentiment }: { sentiment: "positive" | "negative" | "neutral" }) {
  switch (sentiment) {
    case "positive":
      return <TrendingUp className="h-3 w-3 text-success" />;
    case "negative":
      return <TrendingDown className="h-3 w-3 text-danger" />;
    default:
      return <Minus className="h-3 w-3 text-text-secondary" />;
  }
}

export function StockNews({ symbol, limit = 10, compact = false }: StockNewsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stockNews", symbol, limit],
    queryFn: () => fetchStockNews(symbol, limit),
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-20 h-14 bg-surface-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-muted rounded w-3/4" />
              <div className="h-3 bg-surface-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="text-center py-8">
          <Newspaper className="h-8 w-8 text-[#8b8f9a] mx-auto mb-2" />
          <p className="text-xs text-[#8b8f9a]">Failed to load news</p>
        </div>
      </div>
    );
  }

  const articles: NewsArticle[] = (data?.news || data || []).map((article: NewsArticle) => ({
    ...article,
    sentiment: analyzeSentiment(article.title, article.text),
  }));

  // Calculate overall sentiment
  const sentimentCounts = articles.reduce(
    (acc, article) => {
      acc[article.sentiment || "neutral"]++;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const overallSentiment = sentimentCounts.positive > sentimentCounts.negative 
    ? "Bullish" 
    : sentimentCounts.negative > sentimentCounts.positive 
      ? "Bearish" 
      : "Neutral";

  if (compact) {
    return (
      <div className="space-y-2">
        {articles.slice(0, 3).map((article, idx) => (
          <a
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 rounded-lg hover:bg-surface-muted/50 transition-colors group"
          >
            <div className="flex items-start gap-2">
              <SentimentIcon sentiment={article.sentiment || "neutral"} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {article.site} • {formatTimeAgo(article.publishedDate)}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8eaed] flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-[#6c8cff]" />
          Latest News
        </h3>
        <div className={cn(
          "px-2.5 py-1 rounded-lg text-[11px] font-medium",
          overallSentiment === "Bullish" && "bg-[#22c55e]/12 text-[#3dd68c]",
          overallSentiment === "Bearish" && "bg-[#ef4444]/12 text-[#f06c6c]",
          overallSentiment === "Neutral" && "bg-[#1e2028] text-[#8b8f9a]"
        )}>
          {overallSentiment} Sentiment
        </div>
      </div>

      {/* Sentiment Summary */}
      <div className="flex items-center gap-4 p-2.5 rounded-lg bg-[#1a1d24]/80">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-[#3dd68c]" />
          <span className="text-xs text-[#3dd68c]">{sentimentCounts.positive}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Minus className="h-3 w-3 text-[#8b8f9a]" />
          <span className="text-xs text-[#8b8f9a]">{sentimentCounts.neutral}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3 w-3 text-[#f06c6c]" />
          <span className="text-xs text-[#f06c6c]">{sentimentCounts.negative}</span>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {articles.length === 0 ? (
          <p className="text-xs text-[#8b8f9a] text-center py-4">
            No recent news available
          </p>
        ) : (
          articles.map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3 rounded-xl bg-[#1a1d24]/50 hover:bg-[#1e2028] border border-transparent hover:border-[#2d303a]/40 transition-all duration-200 group"
            >
              {/* Image */}
              {article.image && (
                <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#1e2028]">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <SentimentIcon sentiment={article.sentiment || "neutral"} />
                  <h4 className="text-xs font-medium text-[#c0c4cc] line-clamp-2 group-hover:text-[#e8eaed] transition-colors flex-1">
                    {article.title}
                  </h4>
                </div>
                {article.text && (
                  <p className="text-[11px] text-[#6b7280] line-clamp-2 mt-1 ml-5">
                    {article.text}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 ml-5">
                  <span className="text-[11px] text-[#8b8f9a]">{article.site}</span>
                  <span className="w-1 h-1 rounded-full bg-[#6b7280]" />
                  <span className="text-[11px] text-[#8b8f9a] flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTimeAgo(article.publishedDate)}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 text-[#8b8f9a] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
