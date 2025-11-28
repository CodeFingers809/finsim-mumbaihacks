"use client";

import { cn } from "@/lib/utils/cn";

type BarChartProps = {
  data: { label: string; value: number }[];
  height?: number;
  showLabels?: boolean;
  horizontal?: boolean;
  colors?: { positive: string; negative: string };
};

export function BarChart({
  data,
  height = 200,
  showLabels = true,
  horizontal = false,
  colors = { positive: "#3dd68c", negative: "#f06c6c" },
}: BarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => Math.abs(d.value)));
  const hasNegative = data.some((d) => d.value < 0);
  const hasPositive = data.some((d) => d.value >= 0);

  if (horizontal) {
    return (
      <div className="space-y-3" style={{ minHeight: height }}>
        {data.map((item, index) => {
          const percentage = (Math.abs(item.value) / maxValue) * 100;
          const isPositive = item.value >= 0;

          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#e8eaed] truncate max-w-[120px]">{item.label}</span>
                <span
                  className={cn(
                    "font-semibold font-mono",
                    isPositive ? "text-[#3dd68c]" : "text-[#f06c6c]"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-4 w-full bg-[#1a1d24] rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isPositive ? colors.positive : colors.negative,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical bar chart
  const barWidth = Math.min(60, Math.max(30, (300 / data.length) - 8));

  return (
    <div className="flex flex-col" style={{ height }}>
      <div className="flex-1 flex items-end justify-center gap-2 relative">
        {/* Zero line for mixed positive/negative */}
        {hasNegative && hasPositive && (
          <div className="absolute left-0 right-0 top-1/2 border-t border-[#2d303a]/60 border-dashed" />
        )}
        
        {data.map((item, index) => {
          const percentage = (Math.abs(item.value) / maxValue) * 50; // 50% max height for each direction
          const isPositive = item.value >= 0;

          return (
            <div
              key={index}
              className="flex flex-col items-center justify-end h-full relative"
              style={{ width: barWidth }}
            >
              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-500 ease-out relative group cursor-pointer",
                  !isPositive && "rounded-t-none rounded-b-md"
                )}
                style={{
                  height: `${percentage}%`,
                  backgroundColor: isPositive ? colors.positive : colors.negative,
                  marginBottom: isPositive && hasNegative ? "50%" : 0,
                  marginTop: !isPositive ? "50%" : 0,
                  position: hasNegative && hasPositive ? "absolute" : "relative",
                  bottom: isPositive ? "50%" : "auto",
                  top: !isPositive ? "50%" : "auto",
                }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1d24] border border-[#2d303a] rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <span className={isPositive ? "text-[#3dd68c]" : "text-[#f06c6c]"}>
                    {isPositive ? "+" : ""}
                    {item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      {showLabels && (
        <div className="flex justify-center gap-2 mt-3 pt-2 border-t border-[#2d303a]/40">
          {data.map((item, index) => (
            <div
              key={index}
              className="text-[10px] text-[#8b8f9a] text-center truncate transform -rotate-45 origin-top-left"
              style={{ width: barWidth }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
