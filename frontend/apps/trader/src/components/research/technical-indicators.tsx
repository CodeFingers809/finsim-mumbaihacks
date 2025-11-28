"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TechnicalIndicatorsProps {
  quotes: Record<string, MarketQuote>;
  watchlist?: Watchlist;
  isLoading: boolean;
}

// Calculate simple technical indicators (mock for now - in production, fetch from API)
function calculateIndicators(quote: MarketQuote) {
  const price = quote.lastPrice;
  const high = quote.dayHigh || price;
  const low = quote.dayLow || price;

  // Mock RSI (14-day) - would normally need historical data
  const rsi = 45 + Math.random() * 30; // Random between 45-75

  // Mock MACD signal
  const macdValue = (Math.random() - 0.5) * 10;
  const macdSignal = macdValue > 0 ? "bullish" : "bearish";

  // Simple moving average simulation
  const sma20 = price * (0.98 + Math.random() * 0.04);
  const sma50 = price * (0.96 + Math.random() * 0.08);

  // Price vs MA
  const priceVsSMA20 = ((price - sma20) / sma20) * 100;
  const priceVsSMA50 = ((price - sma50) / sma50) * 100;

  // Bollinger Bands (SMA ± 2 standard deviations)
  const stdDev = price * 0.02; // Mock standard deviation as 2% of price
  const bollingerUpper = sma20 + (2 * stdDev);
  const bollingerLower = sma20 - (2 * stdDev);
  const bollingerPosition = ((price - bollingerLower) / (bollingerUpper - bollingerLower)) * 100;

  // ATR (Average True Range) - volatility measure
  const atr = (high - low) * 1.4; // Mock ATR
  const atrPercent = (atr / price) * 100;

  return {
    rsi,
    rsiSignal: rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral",
    macdValue,
    macdSignal,
    sma20,
    sma50,
    priceVsSMA20,
    priceVsSMA50,
    support: low * 0.98,
    resistance: high * 1.02,
    bollingerUpper,
    bollingerLower,
    bollingerMiddle: sma20,
    bollingerPosition,
    atr,
    atrPercent,
  };
}

export function TechnicalIndicators({ quotes, watchlist, isLoading }: TechnicalIndicatorsProps) {
  if (!watchlist || watchlist.stocks.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Technical Indicators</h3>
        </div>
        <p className="text-sm text-[#8b8f9a]">
          Add stocks to your watchlist to see technical analysis
        </p>
      </div>
    );
  }

  const stocksWithIndicators = watchlist.stocks
    .map((stock) => {
      const quote = quotes[stock.symbol];
      if (!quote || typeof quote.lastPrice !== "number") return null;

      return {
        symbol: stock.symbol,
        quote,
        indicators: calculateIndicators(quote),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 4); // Show top 4 stocks

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Technical Indicators</h3>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-[#1a1d24] animate-pulse" />
        ))}
      </div>
    );
  }

  if (stocksWithIndicators.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Technical Indicators</h3>
        </div>
        <p className="text-sm text-[#8b8f9a]">Loading technical data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-[#6c8cff]" />
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Technical Indicators</h3>
      </div>

      {/* Stock Indicators */}
      <div className="space-y-3">
        {stocksWithIndicators.map(({ symbol, quote, indicators }) => (
          <div key={symbol} className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#e8eaed]">{symbol}</p>
                  {indicators.macdSignal === "bullish" ? (
                    <TrendingUp className="h-3 w-3 text-[#3dd68c]" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-[#f06c6c]" />
                  )}
                </div>
                <p className="text-sm font-bold font-mono text-[#e8eaed] mt-0.5">
                  ₹{quote.lastPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-semibold",
                indicators.macdSignal === "bullish" ? "bg-[#3dd68c]/15 text-[#3dd68c]" : "bg-[#f06c6c]/15 text-[#f06c6c]"
              )}>
                {indicators.macdSignal.toUpperCase()}
              </span>
            </div>

            {/* Indicators Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* RSI */}
              <div className="rounded-lg bg-[#2d303a]/30 p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8b8f9a]">RSI (14)</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-medium",
                    indicators.rsiSignal === "overbought" && "bg-[#f06c6c]/15 text-[#f06c6c]",
                    indicators.rsiSignal === "oversold" && "bg-[#3dd68c]/15 text-[#3dd68c]",
                    indicators.rsiSignal === "neutral" && "bg-[#8b8f9a]/15 text-[#8b8f9a]"
                  )}>
                    {indicators.rsiSignal}
                  </span>
                </div>
                <p className="text-base font-bold font-mono text-[#e8eaed]">{indicators.rsi.toFixed(1)}</p>
                <div className="mt-1.5 h-1 rounded-full bg-[#2d303a]/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      indicators.rsi > 70 ? "bg-[#f06c6c]" : indicators.rsi < 30 ? "bg-[#3dd68c]" : "bg-[#6c8cff]"
                    )}
                    style={{ width: `${indicators.rsi}%` }}
                  />
                </div>
              </div>

              {/* MACD */}
              <div className="rounded-lg bg-[#2d303a]/30 p-2">
                <span className="text-[10px] text-[#8b8f9a]">MACD</span>
                <p className={cn(
                  "text-base font-bold font-mono mt-1",
                  indicators.macdValue > 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
                )}>
                  {indicators.macdValue > 0 ? "+" : ""}{indicators.macdValue.toFixed(2)}
                </p>
                <p className="text-[10px] text-[#8b8f9a] mt-0.5">
                  {indicators.macdValue > 0 ? "Upward momentum" : "Downward momentum"}
                </p>
              </div>

              {/* SMA 20 */}
              <div className="rounded-lg bg-[#2d303a]/30 p-2">
                <span className="text-[10px] text-[#8b8f9a]">SMA (20)</span>
                <p className="text-sm font-semibold font-mono text-[#e8eaed] mt-0.5">₹{indicators.sma20.toFixed(2)}</p>
                <p className={cn(
                  "text-[10px] font-medium",
                  indicators.priceVsSMA20 > 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
                )}>
                  {indicators.priceVsSMA20 > 0 ? "+" : ""}{indicators.priceVsSMA20.toFixed(2)}% from price
                </p>
              </div>

              {/* SMA 50 */}
              <div className="rounded-lg bg-[#2d303a]/30 p-2">
                <span className="text-[10px] text-[#8b8f9a]">SMA (50)</span>
                <p className="text-sm font-semibold font-mono text-[#e8eaed] mt-0.5">₹{indicators.sma50.toFixed(2)}</p>
                <p className={cn(
                  "text-[10px] font-medium",
                  indicators.priceVsSMA50 > 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
                )}>
                  {indicators.priceVsSMA50 > 0 ? "+" : ""}{indicators.priceVsSMA50.toFixed(2)}% from price
                </p>
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className="rounded-lg bg-[#2d303a]/30 p-2.5 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-[#8b8f9a]">Bollinger Bands</span>
                <span className="text-[10px] text-[#8b8f9a]">
                  ATR: ₹{indicators.atr.toFixed(2)} ({indicators.atrPercent.toFixed(2)}%)
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-[#8b8f9a]">
                  <span>Lower: ₹{indicators.bollingerLower.toFixed(2)}</span>
                  <span>Mid: ₹{indicators.bollingerMiddle.toFixed(2)}</span>
                  <span>Upper: ₹{indicators.bollingerUpper.toFixed(2)}</span>
                </div>

                <div className="relative h-6 rounded-lg bg-gradient-to-r from-[#f06c6c]/20 via-[#6c8cff]/20 to-[#3dd68c]/20">
                  <div
                    className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-[#e8eaed]"
                    style={{ left: `${Math.max(0, Math.min(100, indicators.bollingerPosition))}%` }}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[#2d303a]/50" />
                </div>

                <p className="text-[9px] text-[#8b8f9a] text-center">
                  {indicators.bollingerPosition < 20
                    ? "Near lower band - potential oversold"
                    : indicators.bollingerPosition > 80
                      ? "Near upper band - potential overbought"
                      : "Within normal range"}
                </p>
              </div>
            </div>

            {/* Support & Resistance */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2d303a]/30">
              <div>
                <span className="text-[10px] text-[#8b8f9a]">Support: </span>
                <span className="text-xs font-semibold font-mono text-[#3dd68c]">₹{indicators.support.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8b8f9a]">Resistance: </span>
                <span className="text-xs font-semibold font-mono text-[#f06c6c]">₹{indicators.resistance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
