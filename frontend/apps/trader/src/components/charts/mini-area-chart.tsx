type MiniAreaChartProps = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export function MiniAreaChart({
  data,
  width = 240,
  height = 80,
  stroke = "#3b82f6",
  fill = "rgba(59,130,246,0.2)",
}: MiniAreaChartProps) {
  if (data.length === 0) {
    return null;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-primary">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <polygon
        fill={fill}
        points={`${points} ${width},${height} 0,${height}`}
      />
    </svg>
  );
}
