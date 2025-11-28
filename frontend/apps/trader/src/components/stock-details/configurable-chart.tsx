"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
  type IChartApi,
  type CandlestickData,
  type HistogramData,
  type LineData,
} from "lightweight-charts";
import { cn } from "@/lib/utils/cn";
import {
  ChevronDown,
  Settings2,
  Maximize2,
  BarChart2,
  LineChart,
  AreaChart,
  CandlestickChart,
  Activity,
  TrendingUp,
} from "lucide-react";

// Chart types available
export type ChartType = "candlestick" | "line" | "area" | "volume" | "rsi" | "macd";

export interface ChartConfig {
  id: string;
  type: ChartType;
  height?: string; // percentage or fixed height
  showVolume?: boolean;
  indicators?: string[];
}

interface ConfigurableChartProps {
  symbol: string;
  data: CandlestickData[];
  volume: HistogramData[];
  currentPrice?: number;
  config: ChartConfig;
  onConfigChange?: (config: ChartConfig) => void;
  technicalData?: {
    rsi?: number[];
    macd?: { macd: number; signal: number; histogram: number }[];
    sma20?: number[];
    sma50?: number[];
    ema12?: number[];
    ema26?: number[];
  };
  showControls?: boolean;
  className?: string;
}

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: any }[] = [
  { value: "candlestick", label: "Candlestick", icon: CandlestickChart },
  { value: "line", label: "Line", icon: LineChart },
  { value: "area", label: "Area", icon: AreaChart },
  { value: "volume", label: "Volume", icon: BarChart2 },
  { value: "rsi", label: "RSI", icon: Activity },
  { value: "macd", label: "MACD", icon: TrendingUp },
];

export function ConfigurableChart({
  symbol,
  data,
  volume,
  currentPrice,
  config,
  onConfigChange,
  technicalData,
  showControls = true,
  className,
}: ConfigurableChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const isDisposed = useRef(false);

  // Generate RSI data from price data
  const generateRSI = (prices: number[], period: number = 14): number[] => {
    const rsi: number[] = [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (i <= period) {
        if (change > 0) gains += change;
        else losses -= change;
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          rsi.push(100 - 100 / (1 + rs));
        }
      } else {
        const prevAvgGain = gains / period;
        const prevAvgLoss = losses / period;
        if (change > 0) {
          gains = (prevAvgGain * (period - 1) + change);
          losses = prevAvgLoss * (period - 1);
        } else {
          gains = prevAvgGain * (period - 1);
          losses = (prevAvgLoss * (period - 1) - change);
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
    return rsi;
  };

  // Generate MACD data
  const generateMACD = (prices: number[]): { macd: number; signal: number; histogram: number }[] => {
    const ema = (data: number[], period: number): number[] => {
      const k = 2 / (period + 1);
      const result: number[] = [data[0]];
      for (let i = 1; i < data.length; i++) {
        result.push(data[i] * k + result[i - 1] * (1 - k));
      }
      return result;
    };

    const ema12 = ema(prices, 12);
    const ema26 = ema(prices, 26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = ema(macdLine.slice(25), 9);
    
    return macdLine.slice(25).map((m, i) => ({
      macd: m,
      signal: signalLine[i] || 0,
      histogram: m - (signalLine[i] || 0),
    }));
  };

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clean up previous chart safely
    if (chartRef.current && !isDisposed.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.warn("Chart already disposed:", error);
      }
      chartRef.current = null;
    }
    
    isDisposed.current = false;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b8f9a",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(45, 48, 58, 0.25)" },
        horzLines: { color: "rgba(45, 48, 58, 0.25)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(108, 140, 255, 0.5)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#6c8cff",
        },
        horzLine: {
          color: "rgba(108, 140, 255, 0.5)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#6c8cff",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(45, 48, 58, 0.4)",
        scaleMargins: { top: 0.1, bottom: config.showVolume ? 0.25 : 0.1 },
      },
      timeScale: {
        borderColor: "rgba(45, 48, 58, 0.4)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      localization: { locale: "en-IN" },
    });

    chartRef.current = chart;

    const prices = data.map(d => d.close);

    // Render based on chart type
    switch (config.type) {
      case "candlestick": {
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#3dd68c",
          downColor: "#f06c6c",
          wickUpColor: "#3dd68c",
          wickDownColor: "#f06c6c",
          borderVisible: false,
        });
        candleSeries.setData(data);

        if (config.showVolume) {
          const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "",
            color: "rgba(108, 140, 255, 0.35)",
          });
          volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
          });
          volumeSeries.setData(volume);
        }

        if (currentPrice && data.length > 0) {
          const lastCandle = data[data.length - 1];
          const isUp = lastCandle.close >= lastCandle.open;
          candleSeries.createPriceLine({
            price: currentPrice,
            color: isUp ? "#3dd68c" : "#f06c6c",
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: "",
          });
        }
        break;
      }

      case "line": {
        const lineSeries = chart.addSeries(LineSeries, {
          color: "#6c8cff",
          lineWidth: 2,
        });
        const lineData: LineData[] = data.map(d => ({
          time: d.time,
          value: d.close,
        }));
        lineSeries.setData(lineData);

        if (config.showVolume) {
          const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "",
            color: "rgba(108, 140, 255, 0.35)",
          });
          volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
          });
          volumeSeries.setData(volume);
        }
        break;
      }

      case "area": {
        const areaSeries = chart.addSeries(AreaSeries, {
          lineColor: "#6c8cff",
          topColor: "rgba(108, 140, 255, 0.4)",
          bottomColor: "rgba(108, 140, 255, 0.05)",
          lineWidth: 2,
        });
        const areaData: LineData[] = data.map(d => ({
          time: d.time,
          value: d.close,
        }));
        areaSeries.setData(areaData);
        break;
      }

      case "volume": {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
        });
        const volumeData = volume.map(v => ({
          ...v,
          color: v.value > (volume[volume.indexOf(v) - 1]?.value || 0) 
            ? "rgba(61, 214, 140, 0.7)" 
            : "rgba(240, 108, 108, 0.7)",
        }));
        volumeSeries.setData(volumeData);
        break;
      }

      case "rsi": {
        const rsiData = technicalData?.rsi || generateRSI(prices);
        const rsiSeries = chart.addSeries(LineSeries, {
          color: "#a855f7",
          lineWidth: 2,
          priceScaleId: "rsi",
        });
        
        chart.priceScale("rsi").applyOptions({
          scaleMargins: { top: 0.1, bottom: 0.1 },
          autoScale: false,
          visible: true,
        });

        const rsiLineData: LineData[] = data.slice(data.length - rsiData.length).map((d, i) => ({
          time: d.time,
          value: rsiData[i],
        }));
        rsiSeries.setData(rsiLineData);

        // Add overbought/oversold lines
        rsiSeries.createPriceLine({ price: 70, color: "#f06c6c", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Overbought" });
        rsiSeries.createPriceLine({ price: 30, color: "#3dd68c", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Oversold" });
        rsiSeries.createPriceLine({ price: 50, color: "#4b5563", lineWidth: 1, lineStyle: 1, axisLabelVisible: false, title: "" });
        break;
      }

      case "macd": {
        const macdData = technicalData?.macd || generateMACD(prices);
        
        // MACD Line
        const macdSeries = chart.addSeries(LineSeries, {
          color: "#6c8cff",
          lineWidth: 2,
          priceScaleId: "macd",
        });
        
        // Signal Line
        const signalSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 2,
          priceScaleId: "macd",
        });

        // Histogram
        const histogramSeries = chart.addSeries(HistogramSeries, {
          priceScaleId: "macd",
        });

        chart.priceScale("macd").applyOptions({
          scaleMargins: { top: 0.1, bottom: 0.1 },
        });

        const macdLineData: LineData[] = data.slice(data.length - macdData.length).map((d, i) => ({
          time: d.time,
          value: macdData[i].macd,
        }));
        const signalLineData: LineData[] = data.slice(data.length - macdData.length).map((d, i) => ({
          time: d.time,
          value: macdData[i].signal,
        }));
        const histogramData: HistogramData[] = data.slice(data.length - macdData.length).map((d, i) => ({
          time: d.time,
          value: macdData[i].histogram,
          color: macdData[i].histogram >= 0 ? "rgba(61, 214, 140, 0.6)" : "rgba(240, 108, 108, 0.6)",
        }));

        macdSeries.setData(macdLineData);
        signalSeries.setData(signalLineData);
        histogramSeries.setData(histogramData);
        break;
      }
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chart && !isDisposed.current) {
        try {
          chart.remove();
          isDisposed.current = true;
        } catch (error) {
          console.warn("Error disposing chart:", error);
        }
      }
      chartRef.current = null;
    };
  }, [data, volume, currentPrice, config, technicalData]);

  const currentTypeOption = CHART_TYPE_OPTIONS.find(o => o.value === config.type);
  const TypeIcon = currentTypeOption?.icon || CandlestickChart;

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-[#8b8f9a]", className)}>
        <p className="text-sm">No chart data available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Chart Controls */}
      {showControls && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
          {/* Chart Type Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1d24]/90 backdrop-blur-sm border border-[#2d303a]/60 text-xs font-medium text-[#e8eaed] hover:bg-[#252730] transition-all"
            >
              <TypeIcon className="h-3.5 w-3.5 text-[#6c8cff]" />
              <span>{currentTypeOption?.label}</span>
              <ChevronDown className="h-3 w-3 text-[#8b8f9a]" />
            </button>
            
            {showTypeMenu && (
              <div className="absolute top-full left-0 mt-1 py-1 bg-[#1a1d24] border border-[#2d303a] rounded-lg shadow-xl z-50 min-w-[140px]">
                {CHART_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onConfigChange?.({ ...config, type: option.value });
                      setShowTypeMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors",
                      config.type === option.value
                        ? "bg-[#6c8cff]/20 text-[#6c8cff]"
                        : "text-[#e8eaed] hover:bg-[#252730]"
                    )}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Toggle (only for candlestick/line) */}
          {(config.type === "candlestick" || config.type === "line") && (
            <button
              onClick={() => onConfigChange?.({ ...config, showVolume: !config.showVolume })}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                config.showVolume
                  ? "bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff]"
                  : "bg-[#1a1d24]/90 backdrop-blur-sm border-[#2d303a]/60 text-[#8b8f9a] hover:bg-[#252730]"
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Vol
            </button>
          )}
        </div>
      )}

      {/* Chart Label */}
      <div className="absolute top-2 right-2 z-20">
        <span className="px-2 py-1 rounded bg-[#1a1d24]/80 text-[10px] text-[#8b8f9a] font-medium uppercase tracking-wider">
          {config.type}
        </span>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        onClick={() => setShowTypeMenu(false)}
      />
    </div>
  );
}

// Chart Layout Manager Component
export type ChartLayout = "single" | "split-horizontal" | "split-vertical" | "quad";

interface ChartLayoutManagerProps {
  layout: ChartLayout;
  onLayoutChange: (layout: ChartLayout) => void;
}

export function ChartLayoutSelector({ layout, onLayoutChange }: ChartLayoutManagerProps) {
  const layouts: { value: ChartLayout; label: string; icon: React.ReactNode }[] = [
    { 
      value: "single", 
      label: "Single", 
      icon: <div className="w-4 h-3 border border-current rounded-sm" /> 
    },
    { 
      value: "split-horizontal", 
      label: "Split H", 
      icon: (
        <div className="w-4 h-3 border border-current rounded-sm flex">
          <div className="flex-1 border-r border-current" />
          <div className="flex-1" />
        </div>
      )
    },
    { 
      value: "split-vertical", 
      label: "Split V", 
      icon: (
        <div className="w-4 h-3 border border-current rounded-sm flex flex-col">
          <div className="flex-1 border-b border-current" />
          <div className="flex-1" />
        </div>
      )
    },
    { 
      value: "quad", 
      label: "Quad", 
      icon: (
        <div className="w-4 h-3 border border-current rounded-sm grid grid-cols-2 grid-rows-2">
          <div className="border-r border-b border-current" />
          <div className="border-b border-current" />
          <div className="border-r border-current" />
          <div />
        </div>
      )
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-lg">
      {layouts.map((l) => (
        <button
          key={l.value}
          onClick={() => onLayoutChange(l.value)}
          title={l.label}
          className={cn(
            "p-1.5 rounded transition-all",
            layout === l.value
              ? "bg-[#6c8cff] text-white"
              : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
          )}
        >
          {l.icon}
        </button>
      ))}
    </div>
  );
}
