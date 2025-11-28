"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadialProgress } from "@/components/charts/radial-progress";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

interface ValuationMetricsProps {
  quotes: Record<string, MarketQuote>;
  watchlist?: Watchlist;
  isLoading: boolean;
}

interface StockValuation {
  symbol: string;
  price: number;
  marketCap: string;
  peRatio: number;
  pbRatio: number;
  eps: number;
  dividendYield: number;
  roe: number;
  debtToEquity: number;
  rating: "Undervalued" | "Fair" | "Overvalued";
}

// Mock valuation data generator (in production, fetch from financial API)
function generateValuation(symbol: string, price: number): StockValuation {
  const hash = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomSeed = (hash % 100) / 100;

  const peRatio = 15 + randomSeed * 25; // 15-40
  const pbRatio = 1 + randomSeed * 5; // 1-6
  const eps = price / peRatio;
  const dividendYield = randomSeed * 3; // 0-3%
  const roe = 10 + randomSeed * 20; // 10-30%
  const debtToEquity = randomSeed * 2; // 0-2

  let rating: "Undervalued" | "Fair" | "Overvalued";
  if (peRatio < 20 && pbRatio < 3) rating = "Undervalued";
  else if (peRatio > 30 || pbRatio > 4) rating = "Overvalued";
  else rating = "Fair";

  // Mock market cap based on price
  const marketCapBillion = (price * (50 + randomSeed * 200)).toFixed(2);

  return {
    symbol,
    price,
    marketCap: `₹${marketCapBillion}B`,
    peRatio,
    pbRatio,
    eps,
    dividendYield,
    roe,
    debtToEquity,
    rating,
  };
}

export function ValuationMetrics({ quotes, watchlist, isLoading }: ValuationMetricsProps) {
  if (!watchlist || watchlist.stocks.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Valuation Metrics</h3>
        </div>
        <p className="text-sm text-[#8b8f9a]">
          Add stocks to your watchlist to see valuation analysis
        </p>
      </div>
    );
  }

  const stocksWithValuation = watchlist.stocks
    .map((stock) => {
      const quote = quotes[stock.symbol];
      if (!quote || typeof quote.lastPrice !== "number") return null;

      return generateValuation(stock.symbol, quote.lastPrice);
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 5);

  if (stocksWithValuation.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Valuation Metrics</h3>
        </div>
        <p className="text-sm text-[#8b8f9a]">Loading valuation data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Fundamental Valuation</h3>
        </div>
      </div>

      {stocksWithValuation.map((stock) => {
        // Calculate health scores (0-100)
        const peScore = Math.max(0, Math.min(100, 100 - ((stock.peRatio - 15) / 25) * 100));
        const roeScore = (stock.roe / 30) * 100;
        const debtScore = Math.max(0, 100 - (stock.debtToEquity / 2) * 100);
        const overallScore = (peScore + roeScore + debtScore) / 3;

        return (
          <div key={stock.symbol} className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-[#e8eaed]">{stock.symbol}</h3>
                <p className="text-[10px] text-[#8b8f9a]">{stock.marketCap} Cap</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <Badge
                  variant={
                    stock.rating === "Undervalued"
                      ? "default"
                      : stock.rating === "Overvalued"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-[10px] font-bold py-0"
                >
                  {stock.rating}
                </Badge>
                <div className="flex items-center gap-0.5">
                  {stock.rating === "Undervalued" ? (
                    <TrendingDown className="h-2.5 w-2.5 text-[#3dd68c]" />
                  ) : stock.rating === "Overvalued" ? (
                    <TrendingUp className="h-2.5 w-2.5 text-[#f06c6c]" />
                  ) : (
                    <DollarSign className="h-2.5 w-2.5 text-[#8b8f9a]" />
                  )}
                  <span className="text-[10px] text-[#8b8f9a]">₹{stock.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Health Score Radial */}
            <div className="flex justify-center mb-2">
              <RadialProgress
                value={overallScore}
                size={70}
                strokeWidth={6}
                color={overallScore > 70 ? "rgb(61, 214, 140)" : overallScore > 40 ? "rgb(234, 179, 8)" : "rgb(240, 108, 108)"}
                label="Health"
              />
            </div>

            {/* Key Metrics Grid with Visual Bars */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="rounded-lg bg-black/30 p-2 space-y-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] text-[#8b8f9a]">P/E Ratio</p>
                  <p className="text-sm font-bold text-[#e8eaed]">{stock.peRatio.toFixed(2)}</p>
                </div>
                <Progress 
                  value={Math.min(100, (stock.peRatio / 40) * 100)} 
                  className="h-1"
                  indicatorClassName={stock.peRatio < 20 ? "bg-[#3dd68c]" : stock.peRatio > 30 ? "bg-[#f06c6c]" : "bg-yellow-500"}
                />
                <p className="text-[10px] text-[#8b8f9a]">
                  {stock.peRatio < 20 ? "✓ Attractive" : stock.peRatio > 30 ? "⚠ Expensive" : "→ Fair"}
                </p>
              </div>

              <div className="rounded-lg bg-black/30 p-2 space-y-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] text-[#8b8f9a]">P/B Ratio</p>
                  <p className="text-sm font-bold text-[#e8eaed]">{stock.pbRatio.toFixed(2)}</p>
                </div>
                <Progress 
                  value={Math.min(100, (stock.pbRatio / 6) * 100)} 
                  className="h-1"
                  indicatorClassName={stock.pbRatio < 3 ? "bg-[#3dd68c]" : "bg-yellow-500"}
                />
                <p className="text-[10px] text-[#8b8f9a]">
                  {stock.pbRatio < 3 ? "✓ Good Value" : "→ Premium"}
                </p>
              </div>

              <div className="rounded-lg bg-black/30 p-2 space-y-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] text-[#8b8f9a]">ROE</p>
                  <p className="text-sm font-bold text-[#e8eaed]">{stock.roe.toFixed(1)}%</p>
                </div>
                <Progress 
                  value={Math.min(100, (stock.roe / 30) * 100)} 
                  className="h-1"
                  indicatorClassName={stock.roe > 15 ? "bg-[#3dd68c]" : "bg-yellow-500"}
                />
                <p className="text-[10px] text-[#8b8f9a]">
                  {stock.roe > 15 ? "✓ Strong" : "→ Moderate"}
                </p>
              </div>

              <div className="rounded-lg bg-black/30 p-2 space-y-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] text-[#8b8f9a]">Div Yield</p>
                  <p className="text-sm font-bold text-[#e8eaed]">{stock.dividendYield.toFixed(2)}%</p>
                </div>
                <Progress 
                  value={Math.min(100, (stock.dividendYield / 3) * 100)} 
                  className="h-1"
                  indicatorClassName="bg-[#6c8cff]"
                />
                <p className="text-[10px] text-[#8b8f9a]">Annual Yield</p>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded bg-black/30 p-1.5 text-center">
                <p className="text-[10px] text-[#8b8f9a]">EPS</p>
                <p className="text-xs font-bold text-[#e8eaed]">₹{stock.eps.toFixed(2)}</p>
              </div>
              <div className="rounded bg-black/30 p-1.5 text-center">
                <p className="text-[10px] text-[#8b8f9a]">Debt/Eq</p>
                <p className={`text-xs font-bold ${stock.debtToEquity < 1 ? "text-[#3dd68c]" : "text-yellow-500"}`}>
                  {stock.debtToEquity.toFixed(2)}
                </p>
              </div>
              <div className="rounded bg-black/30 p-1.5 text-center">
                <p className="text-[10px] text-[#8b8f9a]">Score</p>
                <p className={`text-xs font-bold ${overallScore > 70 ? "text-[#3dd68c]" : overallScore > 40 ? "text-yellow-500" : "text-[#f06c6c]"}`}>
                  {overallScore.toFixed(0)}/100
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Summary Insights */}
      <div className="rounded-xl border border-[#6c8cff]/20 bg-gradient-to-br from-[#6c8cff]/10 to-purple-500/10 p-3">
        <h4 className="mb-2 text-[10px] font-bold text-[#8b8f9a] uppercase flex items-center gap-1">
          <Target className="h-2.5 w-2.5" />
          Portfolio Insights
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xl font-bold text-[#3dd68c]">
              {stocksWithValuation.filter((s) => s.rating === "Undervalued").length}
            </p>
            <p className="text-[10px] text-[#8b8f9a]">Undervalued</p>
          </div>
          <div className="text-center border-x border-[#2d303a]/40">
            <p className="text-xl font-bold text-[#e8eaed]">
              {(stocksWithValuation.reduce((sum, s) => sum + s.peRatio, 0) / stocksWithValuation.length).toFixed(1)}
            </p>
            <p className="text-[10px] text-[#8b8f9a]">Avg P/E</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#3dd68c]">
              {(stocksWithValuation.reduce((sum, s) => sum + s.roe, 0) / stocksWithValuation.length).toFixed(1)}%
            </p>
            <p className="text-[10px] text-[#8b8f9a]">Avg ROE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
