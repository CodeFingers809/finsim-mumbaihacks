"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type CandlestickData,
  type HistogramData,
} from "lightweight-charts";

interface TradingChartProps {
  symbol: string;
  data: CandlestickData[];
  volume: HistogramData[];
  currentPrice?: number;
  onTimeframeChange?: (timeframe: string) => void;
}

export function TradingChart({
  symbol,
  data,
  volume,
  currentPrice,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b8f9a",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(45, 48, 58, 0.3)" },
        horzLines: { color: "rgba(45, 48, 58, 0.3)" },
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
        scaleMargins: { top: 0.1, bottom: 0.2 },
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

    // Candlestick series with softer colors
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#3dd68c",
      downColor: "#f06c6c",
      wickUpColor: "#3dd68c",
      wickDownColor: "#f06c6c",
      borderVisible: false,
    });
    candleSeries.setData(data);

    // Volume series with softer colors
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "rgba(108, 140, 255, 0.35)",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(volume);

    // Add current price line if available
    if (currentPrice && data.length > 0) {
      const lastCandle = data[data.length - 1];
      const isUp = lastCandle.close >= lastCandle.open;
      candleSeries.createPriceLine({
        price: currentPrice,
        color: isUp ? "#22c55e" : "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Current",
      });
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
      chart.remove();
    };
  }, [data, volume, currentPrice]);

  if (!data || data.length === 0) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-500">
        <p>No chart data available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ minHeight: "100%" }}
    />
  );
}
