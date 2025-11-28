"use client";

import { cn } from "@/lib/utils/cn";

type GroupedBarChartProps = {
  data: { label: string; values: { name: string; value: number; color: string }[] }[];
  height?: number;
};

export function GroupedBarChart({ data, height = 220 }: GroupedBarChartProps) {
  if (data.length === 0) return null;

  const allValues = data.flatMap((d) => d.values.map((v) => v.value));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const hasNegative = minValue < 0;
  const range = maxValue - minValue || 1;

  const barWidth = Math.min(24, Math.max(16, 200 / data.length / 2));
  const groupWidth = barWidth * 2 + 4;

  return (
    <div className="flex flex-col" style={{ height }}>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {data[0]?.values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: v.color }}
            />
            <span className="text-xs text-[#8b8f9a]">{v.name}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end justify-center gap-4 relative px-4">
        {/* Zero line */}
        {hasNegative && (
          <div
            className="absolute left-0 right-0 border-t border-[#8b8f9a]/40 border-dashed"
            style={{
              top: `${(maxValue / range) * 100}%`,
            }}
          />
        )}

        {data.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="flex items-end gap-1 h-full relative"
            style={{ width: groupWidth }}
          >
            {group.values.map((item, valueIndex) => {
              const barHeight = Math.abs(item.value) / range;
              const isPositive = item.value >= 0;
              const topOffset = hasNegative
                ? isPositive
                  ? (maxValue / range) * 100 - barHeight * 100
                  : (maxValue / range) * 100
                : (1 - barHeight) * 100;

              return (
                <div
                  key={valueIndex}
                  className="relative group cursor-pointer"
                  style={{
                    width: barWidth,
                    height: "100%",
                  }}
                >
                  <div
                    className={cn(
                      "absolute transition-all duration-500 ease-out",
                      isPositive ? "rounded-t-sm" : "rounded-b-sm"
                    )}
                    style={{
                      width: "100%",
                      height: `${barHeight * 100}%`,
                      top: `${topOffset}%`,
                      backgroundColor: item.color,
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1d24] border border-[#2d303a] rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    <div className="font-medium text-[#e8eaed]">{item.name}</div>
                    <div style={{ color: item.color }}>
                      {item.value > 0 ? "+" : ""}
                      {item.value.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-center gap-4 mt-3 pt-2 border-t border-[#2d303a]/40 px-4">
        {data.map((group, index) => (
          <div
            key={index}
            className="text-[10px] text-[#8b8f9a] text-center truncate"
            style={{ width: groupWidth }}
          >
            {group.label.replace(".NS", "")}
          </div>
        ))}
      </div>
    </div>
  );
}
