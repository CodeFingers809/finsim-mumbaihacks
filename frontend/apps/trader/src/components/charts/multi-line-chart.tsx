"use client";

import { useMemo } from "react";

type LineChartProps = {
    data: {
        label: string;
        color: string;
        points: { date: string; value: number }[];
    }[];
    height?: number;
    showLegend?: boolean;
    showInitialLine?: boolean;
    initialValue?: number;
};

export function MultiLineChart({
    data,
    height = 280,
    showLegend = true,
    showInitialLine = true,
    initialValue,
}: LineChartProps) {
    const chartData = useMemo(() => {
        if (data.length === 0) return null;

        const allValues = data.flatMap((series) =>
            series.points.map((p) => p.value)
        );
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const range = maxValue - minValue || 1;

        const padding = range * 0.1;
        const adjustedMin = minValue - padding;
        const adjustedMax = maxValue + padding;
        const adjustedRange = adjustedMax - adjustedMin;

        // Get all unique dates
        const allDates = Array.from(
            new Set(data.flatMap((series) => series.points.map((p) => p.date)))
        ).sort();

        return {
            allDates,
            minValue: adjustedMin,
            maxValue: adjustedMax,
            range: adjustedRange,
        };
    }, [data]);

    if (!chartData || data.length === 0) return null;

    const { allDates, minValue, maxValue, range } = chartData;

    // Use fixed pixel dimensions for viewBox
    const svgWidth = 1000;
    const svgHeight = 200;
    const legendHeight = showLegend ? 40 : 0;
    const xAxisHeight = 24;
    const yAxisWidth = 60;

    const getY = (value: number) => {
        return ((maxValue - value) / range) * svgHeight;
    };

    const getX = (index: number, total: number) => {
        if (total <= 1) return yAxisWidth;
        return yAxisWidth + (index / (total - 1)) * (svgWidth - yAxisWidth);
    };

    return (
        <div
            className="flex flex-col overflow-hidden"
            style={{ height, maxHeight: height }}
        >
            {/* Legend */}
            {showLegend && (
                <div className="flex flex-wrap items-center justify-center gap-4 mb-2 shrink-0">
                    {data.map((series, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div
                                className="w-8 h-0.5 rounded-full"
                                style={{ backgroundColor: series.color }}
                            />
                            <span className="text-xs text-[#8b8f9a]">
                                {series.label.replace(".NS", "")}
                            </span>
                        </div>
                    ))}
                    {showInitialLine && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 border-t border-dashed border-[#8b8f9a]" />
                            <span className="text-xs text-[#8b8f9a]">
                                Initial
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Chart Container */}
            <div className="flex-1 relative overflow-hidden">
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${svgWidth} ${svgHeight + xAxisHeight}`}
                    preserveAspectRatio="none"
                    className="overflow-visible"
                >
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                        <line
                            key={p}
                            x1={yAxisWidth}
                            y1={p * svgHeight}
                            x2={svgWidth}
                            y2={p * svgHeight}
                            stroke="#2d303a"
                            strokeWidth="1"
                            strokeDasharray={p === 0.5 ? "none" : "4 4"}
                        />
                    ))}

                    {/* Initial value line */}
                    {showInitialLine && initialValue !== undefined && (
                        <line
                            x1={yAxisWidth}
                            y1={getY(initialValue)}
                            x2={svgWidth}
                            y2={getY(initialValue)}
                            stroke="#8b8f9a"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    )}

                    {/* Lines */}
                    {data.map((series, seriesIndex) => {
                        const pathData = series.points
                            .map((point, index) => {
                                const x = getX(index, series.points.length);
                                const y = getY(point.value);
                                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                            })
                            .join(" ");

                        return (
                            <path
                                key={seriesIndex}
                                d={pathData}
                                fill="none"
                                stroke={series.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        );
                    })}

                    {/* Y-axis labels */}
                    <text
                        x="5"
                        y="12"
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                    >
                        ₹
                        {maxValue.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                        })}
                    </text>
                    <text
                        x="5"
                        y={svgHeight / 2 + 4}
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                    >
                        ₹
                        {((maxValue + minValue) / 2).toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                        })}
                    </text>
                    <text
                        x="5"
                        y={svgHeight - 2}
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                    >
                        ₹
                        {minValue.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                        })}
                    </text>

                    {/* X-axis labels */}
                    {allDates.length > 0 && (
                        <>
                            <text
                                x={yAxisWidth}
                                y={svgHeight + 18}
                                fill="#8b8f9a"
                                fontSize="11"
                                fontFamily="monospace"
                                textAnchor="start"
                            >
                                {allDates[0]}
                            </text>
                            {allDates.length > 2 && (
                                <text
                                    x={svgWidth / 2}
                                    y={svgHeight + 18}
                                    fill="#8b8f9a"
                                    fontSize="11"
                                    fontFamily="monospace"
                                    textAnchor="middle"
                                >
                                    {allDates[Math.floor(allDates.length / 2)]}
                                </text>
                            )}
                            <text
                                x={svgWidth - 5}
                                y={svgHeight + 18}
                                fill="#8b8f9a"
                                fontSize="11"
                                fontFamily="monospace"
                                textAnchor="end"
                            >
                                {allDates[allDates.length - 1]}
                            </text>
                        </>
                    )}
                </svg>
            </div>
        </div>
    );
}

