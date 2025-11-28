"use client";

import { useMemo } from "react";

interface RadialProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
  label?: string;
}

export function RadialProgress({
  value,
  size = 80,
  strokeWidth = 8,
  className = "",
  color = "currentColor",
  trackColor = "rgba(255, 255, 255, 0.1)",
  showValue = true,
  label,
}: RadialProgressProps) {
  const { circumference, offset } = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return { circumference, offset };
  }, [size, strokeWidth, value]);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{Math.round(value)}%</span>
          {label && <span className="text-xs text-text-secondary">{label}</span>}
        </div>
      )}
    </div>
  );
}
