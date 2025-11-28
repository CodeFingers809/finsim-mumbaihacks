"use client";

import { cn } from "@/lib/utils/cn";

type DrawdownChartProps = {
  data: { date: string; drawdown: number }[];
  height?: number;
};

export function DrawdownChart({ data, height = 150 }: DrawdownChartProps) {
  if (data.length === 0) return null;

  const minDrawdown = Math.min(...data.map((d) => d.drawdown));
  const maxDrawdown = 0; // Drawdown is always <= 0

  const width = 100;
  const chartHeight = height - 30;

  const getY = (value: number) => {
    const range = Math.abs(minDrawdown) || 1;
    return (Math.abs(value) / range) * chartHeight;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * width;
  };

  // Build path
  const areaPath = data
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.drawdown);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ") + ` L ${width} 0 L 0 0 Z`;

  return (
    <div className="space-y-2">
      <div className="relative" style={{ height }}>
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
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

          {/* Drawdown area */}
          <path d={areaPath} fill="rgba(240, 108, 108, 0.3)" />

          {/* Drawdown line */}
          <path
            d={data
              .map((point, index) => {
                const x = getX(index);
                const y = getY(point.drawdown);
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#f06c6c"
            strokeWidth="0.4"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-[#8b8f9a] font-mono">
          <span>0%</span>
          <span>{minDrawdown.toFixed(1)}%</span>
        </div>

        {/* Max drawdown indicator */}
        <div className="absolute left-2 top-2 px-2 py-1 bg-[#f06c6c]/20 border border-[#f06c6c]/40 rounded text-[10px] text-[#f06c6c]">
          Max: {minDrawdown.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
