"use client";

import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  fillColor?: string;
  showFill?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  className = "",
  color = "currentColor",
  fillColor = "currentColor",
  showFill = true,
}: SparklineProps) {
  const { path, fillPath } = useMemo(() => {
    if (data.length < 2) {
      return { path: "", fillPath: "" };
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return { x, y };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    const fillPathData = showFill
      ? `${pathData} L ${width} ${height} L 0 ${height} Z`
      : "";

    return { path: pathData, fillPath: fillPathData };
  }, [data, width, height, showFill]);

  if (data.length < 2) {
    return null;
  }

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {showFill && (
        <path d={fillPath} fill={fillColor} opacity="0.2" />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
