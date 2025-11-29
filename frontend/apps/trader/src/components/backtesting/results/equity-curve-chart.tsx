"use client";

import type { EquityPoint } from "@trader/types";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

interface EquityCurveChartProps {
    data: EquityPoint[];
    capital: number;
}

export function EquityCurveChart({ data, capital }: EquityCurveChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        const values = data.map((d) => d.equity);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        // Add some padding to the range
        const paddedMin = min - range * 0.1;
        const paddedMax = max + range * 0.1;
        const paddedRange = paddedMax - paddedMin;

        return {
            points: data.map((d, i) => ({
                x: (i / (data.length - 1)) * 100,
                y: ((d.equity - paddedMin) / paddedRange) * 100,
                date: d.date,
                equity: d.equity,
            })),
            min: paddedMin,
            max: paddedMax,
            initial: capital,
            final: values[values.length - 1],
            isPositive: values[values.length - 1] >= capital,
        };
    }, [data, capital]);

    if (!chartData) {
        return (
            <Card className="bg-[#12141a] border-[#2d303a]/50">
                <CardHeader className="border-b border-[#2d303a]/40">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#3dd68c]" />
                        <CardTitle className="text-[#e8eaed] text-base">
                            Equity Curve
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="py-12 text-center">
                    <p className="text-sm text-[#8b8f9a]">
                        No equity data available
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Generate SVG path
    const pathD = chartData.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${100 - p.y}`)
        .join(" ");

    // Generate area path (filled)
    const areaD = `${pathD} L 100 100 L 0 100 Z`;

    // Calculate where the initial capital line should be
    const initialY =
        100 -
        ((capital - chartData.min) / (chartData.max - chartData.min)) * 100;

    return (
        <Card className="bg-[#12141a] border-[#2d303a]/50">
            <CardHeader className="border-b border-[#2d303a]/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#3dd68c]" />
                        <CardTitle className="text-[#e8eaed] text-base">
                            Portfolio Equity Curve
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-[#8b8f9a]" />
                            <span className="text-[#8b8f9a]">
                                Initial: ₹{capital.toLocaleString("en-IN")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-3 h-0.5 ${
                                    chartData.isPositive
                                        ? "bg-[#3dd68c]"
                                        : "bg-[#f06c6c]"
                                }`}
                            />
                            <span
                                className={
                                    chartData.isPositive
                                        ? "text-[#3dd68c]"
                                        : "text-[#f06c6c]"
                                }
                            >
                                Final: ₹
                                {chartData.final.toLocaleString("en-IN")}
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="relative h-[280px] w-full">
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full"
                    >
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient
                                id="equityGradient"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={
                                        chartData.isPositive
                                            ? "#3dd68c"
                                            : "#f06c6c"
                                    }
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={
                                        chartData.isPositive
                                            ? "#3dd68c"
                                            : "#f06c6c"
                                    }
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                            <line
                                key={y}
                                x1="0"
                                y1={y}
                                x2="100"
                                y2={y}
                                stroke="#2d303a"
                                strokeWidth="0.2"
                                strokeOpacity="0.5"
                            />
                        ))}

                        {/* Initial capital line */}
                        <line
                            x1="0"
                            y1={initialY}
                            x2="100"
                            y2={initialY}
                            stroke="#8b8f9a"
                            strokeWidth="0.3"
                            strokeDasharray="2,2"
                        />

                        {/* Area fill */}
                        <path
                            d={areaD}
                            fill="url(#equityGradient)"
                            strokeWidth="0"
                        />

                        {/* Line */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke={
                                chartData.isPositive ? "#3dd68c" : "#f06c6c"
                            }
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-[#8b8f9a] font-mono -translate-x-2">
                        <span>
                            ₹{Math.round(chartData.max).toLocaleString("en-IN")}
                        </span>
                        <span>
                            ₹
                            {Math.round(
                                (chartData.max + chartData.min) / 2
                            ).toLocaleString("en-IN")}
                        </span>
                        <span>
                            ₹{Math.round(chartData.min).toLocaleString("en-IN")}
                        </span>
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-[#8b8f9a] translate-y-4">
                        <span>{data[0]?.date}</span>
                        <span>{data[Math.floor(data.length / 2)]?.date}</span>
                        <span>{data[data.length - 1]?.date}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

