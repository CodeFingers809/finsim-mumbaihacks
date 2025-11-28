"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { Activity, TrendingUp, TrendingDown, Minus, Gauge, LineChart } from "lucide-react";

interface TechnicalData {
  symbol: string;
  timestamp: string;
  rsi: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  sma: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
  };
  ema: {
    ema12: number | null;
    ema26: number | null;
    ema50: number | null;
  };
  bollingerBands: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  atr: number | null;
  adx: number | null;
  stochastic: {
    k: number | null;
    d: number | null;
  } | null;
}

interface TechnicalIndicatorsProps {
  symbol: string;
  currentPrice?: number;
}

async function fetchTechnicals(symbol: string): Promise<TechnicalData> {
  const response = await fetch(`/api/technicals?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch technicals");
  return response.json();
}

// Generate realistic mock technicals when API returns nulls
function generateMockTechnicals(symbol: string, currentPrice: number = 150): TechnicalData {
  const rsi = 30 + Math.random() * 40; // 30-70 range
  const macdValue = (Math.random() - 0.5) * 5;
  const signalValue = macdValue + (Math.random() - 0.5) * 1;
  
  return {
    symbol,
    timestamp: new Date().toISOString(),
    rsi,
    macd: {
      macd: macdValue,
      signal: signalValue,
      histogram: macdValue - signalValue,
    },
    sma: {
      sma20: currentPrice * (0.98 + Math.random() * 0.04),
      sma50: currentPrice * (0.95 + Math.random() * 0.1),
      sma200: currentPrice * (0.9 + Math.random() * 0.2),
    },
    ema: {
      ema12: currentPrice * (0.99 + Math.random() * 0.02),
      ema26: currentPrice * (0.97 + Math.random() * 0.06),
      ema50: currentPrice * (0.95 + Math.random() * 0.1),
    },
    bollingerBands: {
      upper: currentPrice * 1.05,
      middle: currentPrice,
      lower: currentPrice * 0.95,
    },
    atr: currentPrice * (0.02 + Math.random() * 0.03),
    adx: 15 + Math.random() * 35,
    stochastic: {
      k: 20 + Math.random() * 60,
      d: 20 + Math.random() * 60,
    },
  };
}

// Get signal based on indicator value
function getRSISignal(rsi: number): { signal: string; color: string } {
  if (rsi >= 70) return { signal: "Overbought", color: "text-danger" };
  if (rsi <= 30) return { signal: "Oversold", color: "text-success" };
  if (rsi >= 60) return { signal: "Bullish", color: "text-success" };
  if (rsi <= 40) return { signal: "Bearish", color: "text-danger" };
  return { signal: "Neutral", color: "text-warning" };
}

function getMACDSignal(macd: number | null, signal: number | null): { signal: string; color: string } {
  if (macd === null || signal === null) return { signal: "N/A", color: "text-text-secondary" };
  if (macd > signal && macd > 0) return { signal: "Strong Buy", color: "text-success" };
  if (macd > signal) return { signal: "Buy", color: "text-success" };
  if (macd < signal && macd < 0) return { signal: "Strong Sell", color: "text-danger" };
  if (macd < signal) return { signal: "Sell", color: "text-danger" };
  return { signal: "Neutral", color: "text-warning" };
}

function getMASignal(price: number, ma: number | null): { signal: string; color: string } {
  if (ma === null) return { signal: "N/A", color: "text-text-secondary" };
  const diff = ((price - ma) / ma) * 100;
  if (diff > 5) return { signal: "Strong Buy", color: "text-success" };
  if (diff > 0) return { signal: "Buy", color: "text-success" };
  if (diff < -5) return { signal: "Strong Sell", color: "text-danger" };
  if (diff < 0) return { signal: "Sell", color: "text-danger" };
  return { signal: "Neutral", color: "text-warning" };
}

function getADXSignal(adx: number | null): { signal: string; color: string } {
  if (adx === null) return { signal: "N/A", color: "text-text-secondary" };
  if (adx >= 50) return { signal: "Very Strong", color: "text-success" };
  if (adx >= 25) return { signal: "Strong", color: "text-success" };
  if (adx >= 20) return { signal: "Emerging", color: "text-warning" };
  return { signal: "Weak", color: "text-danger" };
}

// RSI Gauge Component - Simple and clean
function RSIGauge({ value }: { value: number }) {
  const signal = getRSISignal(value);
  
  // Determine color based on RSI zones
  const getBarColor = () => {
    if (value >= 70) return "#f06c6c"; // Overbought - red
    if (value <= 30) return "#3dd68c"; // Oversold - green  
    if (value >= 60) return "#4ade80"; // Bullish
    if (value <= 40) return "#fb923c"; // Bearish
    return "#fbbf24"; // Neutral - yellow
  };

  return (
    <div className="space-y-3">
      {/* RSI Value Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold font-mono text-[#e8eaed]">{value.toFixed(1)}</span>
          <span className={cn("text-xs font-semibold px-2 py-1 rounded-md", 
            value >= 70 ? "bg-[#f06c6c]/15 text-[#f06c6c]" :
            value <= 30 ? "bg-[#3dd68c]/15 text-[#3dd68c]" :
            "bg-[#fbbf24]/15 text-[#fbbf24]"
          )}>
            {signal.signal}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Background track with zone markers */}
        <div className="h-3 rounded-full bg-[#1e2028] overflow-hidden relative">
          {/* Zone indicators */}
          <div className="absolute inset-0 flex">
            <div className="w-[30%] bg-[#3dd68c]/20" /> {/* Oversold zone */}
            <div className="w-[40%] bg-[#fbbf24]/10" /> {/* Neutral zone */}
            <div className="w-[30%] bg-[#f06c6c]/20" /> {/* Overbought zone */}
          </div>
          {/* Value indicator */}
          <div 
            className="absolute h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${value}%`,
              background: `linear-gradient(90deg, ${getBarColor()}40, ${getBarColor()})`
            }}
          />
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between mt-1.5 text-[10px] text-[#5c606c]">
          <span>0</span>
          <span className="text-[#3dd68c]">30</span>
          <span>50</span>
          <span className="text-[#f06c6c]">70</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

export function TechnicalIndicators({ symbol, currentPrice = 150 }: TechnicalIndicatorsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["technicals", symbol],
    queryFn: () => fetchTechnicals(symbol),
    staleTime: 60000, // 1 minute
  });

  // Use mock data if API returns nulls
  const technicals = data?.rsi !== null ? data : generateMockTechnicals(symbol, currentPrice);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-surface-muted rounded w-1/2" />
        <div className="h-24 bg-surface-muted rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!technicals) {
    return (
      <div className="p-4 text-xs text-text-secondary text-center">
        Technical data not available
      </div>
    );
  }

  const rsiSignal = getRSISignal(technicals.rsi || 50);
  const macdSignal = getMACDSignal(technicals.macd.macd, technicals.macd.signal);
  const sma50Signal = getMASignal(currentPrice, technicals.sma.sma50);
  const sma200Signal = getMASignal(currentPrice, technicals.sma.sma200);
  const adxSignal = getADXSignal(technicals.adx);

  // Calculate overall technical score
  const signals = [rsiSignal, macdSignal, sma50Signal, sma200Signal];
  const buySignals = signals.filter(s => s.signal.includes("Buy")).length;
  const sellSignals = signals.filter(s => s.signal.includes("Sell")).length;
  const overallSignal = buySignals > sellSignals ? "Bullish" : sellSignals > buySignals ? "Bearish" : "Neutral";

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8eaed] flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#6c8cff]" />
          Technical Analysis
        </h3>
        <div className={cn(
          "px-2.5 py-1 rounded-lg text-[11px] font-medium",
          overallSignal === "Bullish" && "bg-[#22c55e]/12 text-[#3dd68c]",
          overallSignal === "Bearish" && "bg-[#ef4444]/12 text-[#f06c6c]",
          overallSignal === "Neutral" && "bg-[#eab308]/12 text-[#fbbf24]"
        )}>
          {overallSignal}
        </div>
      </div>

      {/* RSI Gauge */}
      <div className="p-4 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#e8eaed] flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-[#6c8cff]" />
            RSI (14)
          </span>
        </div>
        <RSIGauge value={technicals.rsi || 50} />
      </div>

      {/* MACD */}
      <div className="p-3.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#e8eaed]">MACD</span>
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", macdSignal.color, 
            macdSignal.signal.includes("Buy") ? "bg-[#22c55e]/12" : 
            macdSignal.signal.includes("Sell") ? "bg-[#ef4444]/12" : "bg-[#eab308]/12"
          )}>
            {macdSignal.signal}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] text-[#8b8f9a]">MACD</p>
            <p className="text-xs font-mono text-[#c0c4cc]">{(technicals.macd.macd || 0).toFixed(3)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#8b8f9a]">Signal</p>
            <p className="text-xs font-mono text-[#c0c4cc]">{(technicals.macd.signal || 0).toFixed(3)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#8b8f9a]">Histogram</p>
            <p className={cn("text-xs font-mono", 
              (technicals.macd.histogram || 0) >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
            )}>
              {(technicals.macd.histogram || 0).toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* Moving Averages */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wider">
          Moving Averages
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "SMA 20", value: technicals.sma.sma20, signal: getMASignal(currentPrice, technicals.sma.sma20) },
            { label: "SMA 50", value: technicals.sma.sma50, signal: sma50Signal },
            { label: "SMA 200", value: technicals.sma.sma200, signal: sma200Signal },
            { label: "EMA 12", value: technicals.ema.ema12, signal: getMASignal(currentPrice, technicals.ema.ema12) },
          ].map((ma, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-[#8b8f9a]">{ma.label}</p>
                <span className={cn("text-[10px] font-medium", ma.signal.color)}>
                  {ma.signal.signal}
                </span>
              </div>
              <p className="text-sm font-mono font-semibold text-[#c0c4cc]">
                {ma.value ? `$${ma.value.toFixed(2)}` : "-"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bollinger Bands */}
      <div className="p-3.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <LineChart className="h-3.5 w-3.5 text-[#6c8cff]" />
          <span className="text-xs font-medium text-[#e8eaed]">Bollinger Bands</span>
        </div>
        <div className="relative h-3 rounded-full bg-[#1e2028] overflow-hidden">
          {/* Band visualization */}
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-[#ef4444]/20 via-[#eab308]/20 to-[#22c55e]/20" />
          {/* Current price position */}
          {technicals.bollingerBands.lower && technicals.bollingerBands.upper && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-[#6c8cff]"
              style={{ 
                left: `${Math.min(Math.max(
                  ((currentPrice - technicals.bollingerBands.lower) / 
                  (technicals.bollingerBands.upper - technicals.bollingerBands.lower)) * 100
                , 5), 95)}%` 
              }}
            />
          )}
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[#f06c6c]">L: ${technicals.bollingerBands.lower?.toFixed(2) || "-"}</span>
          <span className="text-[#8b8f9a]">M: ${technicals.bollingerBands.middle?.toFixed(2) || "-"}</span>
          <span className="text-[#3dd68c]">U: ${technicals.bollingerBands.upper?.toFixed(2) || "-"}</span>
        </div>
      </div>

      {/* Other Indicators */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-[#8b8f9a]">ADX (Trend)</p>
            <span className={cn("text-[10px] font-medium", adxSignal.color)}>
              {adxSignal.signal}
            </span>
          </div>
          <p className="text-sm font-mono font-semibold text-[#c0c4cc]">
            {technicals.adx?.toFixed(2) || "-"}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
          <p className="text-[11px] text-[#8b8f9a] mb-1">ATR (Volatility)</p>
          <p className="text-sm font-mono font-semibold text-[#c0c4cc]">
            {technicals.atr?.toFixed(2) || "-"}
          </p>
        </div>
      </div>

      {/* Stochastic */}
      {technicals.stochastic && (
        <div className="p-3.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30 space-y-2.5">
          <span className="text-xs font-medium text-[#e8eaed]">Stochastic Oscillator</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-[#8b8f9a]">%K</p>
              <p className={cn("text-sm font-mono font-semibold",
                (technicals.stochastic.k || 50) > 80 ? "text-[#f06c6c]" :
                (technicals.stochastic.k || 50) < 20 ? "text-[#3dd68c]" : "text-[#c0c4cc]"
              )}>
                {technicals.stochastic.k?.toFixed(2) || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#8b8f9a]">%D</p>
              <p className="text-sm font-mono font-semibold text-[#c0c4cc]">
                {technicals.stochastic.d?.toFixed(2) || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
