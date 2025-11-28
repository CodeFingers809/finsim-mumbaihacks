"use client";

import { cn } from "@/lib/utils/cn";

type HeatmapProps = {
  data: { x: string; y: string; value: number }[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: { min: string; mid: string; max: string };
};

export function Heatmap({
  data,
  xLabels,
  yLabels,
  colorScale = { min: "#f06c6c", mid: "#1a1d24", max: "#3dd68c" },
}: HeatmapProps) {
  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values.map(Math.abs));

  const getColor = (value: number) => {
    if (maxVal === 0) return colorScale.mid;
    const normalized = value / maxVal; // -1 to 1
    
    if (normalized > 0) {
      // Interpolate between mid and max (green)
      const intensity = Math.min(normalized, 1);
      return `rgba(61, 214, 140, ${intensity * 0.8})`;
    } else if (normalized < 0) {
      // Interpolate between mid and min (red)
      const intensity = Math.min(Math.abs(normalized), 1);
      return `rgba(240, 108, 108, ${intensity * 0.8})`;
    }
    return colorScale.mid;
  };

  const dataMap = new Map<string, number>();
  data.forEach((d) => {
    dataMap.set(`${d.x}-${d.y}`, d.value);
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Header row */}
        <div className="flex">
          <div className="w-20 h-8" /> {/* Corner cell */}
          {xLabels.map((label) => (
            <div
              key={label}
              className="w-16 h-8 flex items-center justify-center text-[10px] text-[#8b8f9a] font-medium"
            >
              {label.replace(".NS", "")}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {yLabels.map((yLabel) => (
          <div key={yLabel} className="flex">
            <div className="w-20 h-12 flex items-center text-[10px] text-[#8b8f9a] font-medium pr-2">
              {yLabel.replace(".NS", "")}
            </div>
            {xLabels.map((xLabel) => {
              const value = dataMap.get(`${xLabel}-${yLabel}`) ?? 0;
              const isDiagonal = xLabel === yLabel;
              
              return (
                <div
                  key={`${xLabel}-${yLabel}`}
                  className={cn(
                    "w-16 h-12 flex items-center justify-center text-[10px] font-medium rounded-sm m-0.5 transition-all duration-200",
                    isDiagonal ? "bg-[#6c8cff]/30 text-[#6c8cff]" : "text-[#e8eaed]"
                  )}
                  style={{
                    backgroundColor: isDiagonal ? undefined : getColor(value),
                  }}
                  title={`${xLabel} vs ${yLabel}: ${value.toFixed(2)}`}
                >
                  {value.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}

        {/* Color scale legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#2d303a]/40">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#f06c6c]/80" />
            <span className="text-[10px] text-[#8b8f9a]">Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#1a1d24]" />
            <span className="text-[10px] text-[#8b8f9a]">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#3dd68c]/80" />
            <span className="text-[10px] text-[#8b8f9a]">Positive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
