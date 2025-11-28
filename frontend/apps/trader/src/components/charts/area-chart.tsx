"use client";

import { cn } from "@/lib/utils/cn";

type AreaChartProps = {
  data: { date: string; value: number }[];
  height?: number;
  color?: string;
  fillColor?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  label?: string;
};

export function AreaChart({
  data,
  height = 120,
  color = "#6c8cff",
  fillColor,
  showGrid = true,
  showLabels = true,
  label,
}: AreaChartProps) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const padding = range * 0.1;
  const adjustedMin = minValue - padding;
  const adjustedMax = maxValue + padding;
  const adjustedRange = adjustedMax - adjustedMin;

  const width = 100;
  const chartHeight = height - 30;

  const getY = (value: number) => {
    return ((adjustedMax - value) / adjustedRange) * chartHeight;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * width;
  };

  // Build path
  const linePath = data
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${width} ${chartHeight} L 0 ${chartHeight} Z`;

  // Determine if overall trend is positive or negative
  const startValue = data[0]?.value ?? 0;
  const endValue = data[data.length - 1]?.value ?? 0;
  const isPositive = endValue >= startValue;
  const actualColor = color;
  const actualFill = fillColor ?? (isPositive ? "rgba(61, 214, 140, 0.15)" : "rgba(240, 108, 108, 0.15)");

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#e8eaed]">{label}</span>
          <span className={cn(
            "text-xs font-semibold",
            isPositive ? "text-[#3dd68c]" : "text-[#f06c6c]"
          )}>
            {isPositive ? "+" : ""}{((endValue - startValue) / startValue * 100).toFixed(2)}%
          </span>
        </div>
      )}
      
      <div className="relative" style={{ height }}>
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {showGrid && (
            <>
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <line
                  key={p}
                  x1="0"
                  y1={p * chartHeight}
                  x2={width}
                  y2={p * chartHeight}
                  stroke="#2d303a"
                  strokeWidth="0.2"
                  strokeDasharray="1 1"
                />
              ))}
            </>
          )}

          {/* Area fill */}
          <path d={areaPath} fill={actualFill} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={isPositive ? "#3dd68c" : "#f06c6c"}
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Y-axis labels */}
        {showLabels && (
          <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-[#8b8f9a] font-mono">
            <span>{adjustedMax.toFixed(0)}</span>
            <span>{adjustedMin.toFixed(0)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
