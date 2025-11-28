"use client";

import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  trend?: "up" | "down" | "neutral";
};

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  size = "md",
  trend,
}: StatCardProps) {
  const determinedTrend = trend ?? (change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : undefined);

  return (
    <div className={cn(
      "p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40",
      size === "sm" && "p-3",
      size === "lg" && "p-5"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "text-[#8b8f9a]",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}>
            {label}
          </p>
          <p className={cn(
            "font-bold text-[#e8eaed] font-mono",
            size === "sm" && "text-lg",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl"
          )}>
            {value}
          </p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1",
              determinedTrend === "up" && "text-[#3dd68c]",
              determinedTrend === "down" && "text-[#f06c6c]",
              determinedTrend === "neutral" && "text-[#8b8f9a]"
            )}>
              {determinedTrend === "up" && <TrendingUp className="h-3 w-3" />}
              {determinedTrend === "down" && <TrendingDown className="h-3 w-3" />}
              {determinedTrend === "neutral" && <Minus className="h-3 w-3" />}
              <span className="text-xs font-medium">
                {change > 0 ? "+" : ""}{change.toFixed(2)}%
              </span>
              {changeLabel && (
                <span className="text-[10px] text-[#8b8f9a]">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-[#12141a] border border-[#2d303a]/40">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
