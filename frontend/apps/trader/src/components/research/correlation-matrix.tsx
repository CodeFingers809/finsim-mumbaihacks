"use client";

import type { MarketQuote, Watchlist } from "@trader/types";
import { Grid3X3 } from "lucide-react";

interface CorrelationMatrixProps {
  quotes: Record<string, MarketQuote>;
  watchlist?: Watchlist;
  isLoading: boolean;
}

// Mock correlation calculation (in production, use historical price data)
function calculateCorrelation(symbol1: string, symbol2: string): number {
  // Generate consistent mock correlation between -1 and 1
  const hash = (symbol1 + symbol2).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.sin(hash) * 0.8; // Scale to make correlations more realistic
}

function getCorrelationColor(value: number): string {
  if (value > 0.7) return "bg-[#3dd68c]/80 text-white";
  if (value > 0.3) return "bg-[#3dd68c]/40 text-[#e8eaed]";
  if (value > -0.3) return "bg-[#8b8f9a]/20 text-[#e8eaed]";
  if (value > -0.7) return "bg-[#f06c6c]/40 text-[#e8eaed]";
  return "bg-[#f06c6c]/80 text-white";
}

export function CorrelationMatrix({ quotes, watchlist, isLoading }: CorrelationMatrixProps) {
  if (!watchlist || watchlist.stocks.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Grid3X3 className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Correlation Matrix</h3>
        </div>
        <p className="text-sm text-[#8b8f9a]">
          Add stocks to your watchlist to see correlation analysis
        </p>
      </div>
    );
  }

  const symbols = watchlist.stocks
    .map((s) => s.symbol)
    .filter((symbol) => quotes[symbol])
    .slice(0, 6); // Limit to 6 stocks for readability

  if (symbols.length < 2) {
    return (
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Grid3X3 className="h-4 w-4 text-[#6c8cff]" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Correlation Matrix</h3>
        </div>
        <p className="text-sm text-[#8b8f9a]">
          Add at least 2 stocks to see correlations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-4 w-4 text-[#6c8cff]" />
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">Stock Correlation Matrix</h3>
      </div>
      <p className="text-[10px] text-[#8b8f9a]">
        Shows how stocks move together (+1: perfect positive, -1: perfect negative)
      </p>

      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-[#8b8f9a]"></th>
                {symbols.map((symbol) => (
                  <th key={symbol} className="p-2 text-center font-medium text-[#8b8f9a]">
                    {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((symbol1) => (
                <tr key={symbol1}>
                  <td className="p-2 font-medium text-[#8b8f9a]">{symbol1}</td>
                  {symbols.map((symbol2) => {
                    const correlation =
                      symbol1 === symbol2 ? 1.0 : calculateCorrelation(symbol1, symbol2);
                    const colorClass = getCorrelationColor(correlation);

                    return (
                      <td key={symbol2} className="p-1">
                        <div
                          className={`rounded px-2 py-1 text-center font-semibold text-[10px] ${colorClass}`}
                          title={`Correlation: ${correlation.toFixed(3)}`}
                        >
                          {correlation.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded bg-[#f06c6c]/80"></div>
            <span className="text-[#8b8f9a]">Strong Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded bg-[#8b8f9a]/20"></div>
            <span className="text-[#8b8f9a]">Weak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded bg-[#3dd68c]/80"></div>
            <span className="text-[#8b8f9a]">Strong Positive</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-3">
        <h4 className="mb-2 text-[10px] font-medium text-[#8b8f9a] uppercase tracking-wider">
          Diversification Insights
        </h4>
        <ul className="space-y-1 text-[10px] text-[#8b8f9a]">
          <li>• Stocks with high positive correlation move together</li>
          <li>• Negative correlation helps reduce portfolio risk</li>
          <li>• Aim for low/negative correlations for better diversification</li>
        </ul>
      </div>
    </div>
  );
}
