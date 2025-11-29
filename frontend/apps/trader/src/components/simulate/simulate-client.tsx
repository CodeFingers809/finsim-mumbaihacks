"use client";

import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    DollarSign,
    BarChart3,
    Play,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Percent,
    Activity,
    Target,
    LineChart,
    RefreshCw,
    Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerminalLayout } from "@/components/layout/terminal-layout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type {
    SimulateResponse,
    SimulateStatistics,
    SimulateEquityCurves,
} from "@/app/api/simulate/route";

// Default values for the simulation
const DEFAULT_VALUES = {
    n_simulations: 1000,
    starting_capital: 100000,
    risk_per_trade: 0.02,
    risk_reward_ratio: 2.0,
    win_rate: 0.55,
    num_trades: 100,
};

// Preset configurations
const PRESETS = [
    {
        name: "Conservative",
        values: {
            risk_per_trade: 0.01,
            risk_reward_ratio: 1.5,
            win_rate: 0.6,
        },
    },
    {
        name: "Moderate",
        values: {
            risk_per_trade: 0.02,
            risk_reward_ratio: 2.0,
            win_rate: 0.55,
        },
    },
    {
        name: "Aggressive",
        values: {
            risk_per_trade: 0.05,
            risk_reward_ratio: 3.0,
            win_rate: 0.45,
        },
    },
];

export function SimulateClient() {
    const [nSimulations, setNSimulations] = useState(
        DEFAULT_VALUES.n_simulations
    );
    const [startingCapital, setStartingCapital] = useState(
        DEFAULT_VALUES.starting_capital
    );
    const [riskPerTrade, setRiskPerTrade] = useState(
        DEFAULT_VALUES.risk_per_trade
    );
    const [riskRewardRatio, setRiskRewardRatio] = useState(
        DEFAULT_VALUES.risk_reward_ratio
    );
    const [winRate, setWinRate] = useState(DEFAULT_VALUES.win_rate);
    const [numTrades, setNumTrades] = useState(DEFAULT_VALUES.num_trades);
    const [result, setResult] = useState<SimulateResponse | null>(null);

    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    n_simulations: nSimulations,
                    starting_capital: startingCapital,
                    risk_per_trade: riskPerTrade,
                    risk_reward_ratio: riskRewardRatio,
                    win_rate: winRate,
                    num_trades: numTrades,
                }),
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Simulation failed");
            }
            return response.json();
        },
        onSuccess: (payload: SimulateResponse) => {
            setResult(payload);
            toast.success("Monte Carlo simulation completed!");
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to run simulation"
            );
        },
    });

    const handleSubmit = () => {
        if (mutation.isPending) return;
        mutation.mutate();
    };

    const applyPreset = (preset: (typeof PRESETS)[0]) => {
        setRiskPerTrade(preset.values.risk_per_trade);
        setRiskRewardRatio(preset.values.risk_reward_ratio);
        setWinRate(preset.values.win_rate);
    };

    const resetToDefaults = () => {
        setNSimulations(DEFAULT_VALUES.n_simulations);
        setStartingCapital(DEFAULT_VALUES.starting_capital);
        setRiskPerTrade(DEFAULT_VALUES.risk_per_trade);
        setRiskRewardRatio(DEFAULT_VALUES.risk_reward_ratio);
        setWinRate(DEFAULT_VALUES.win_rate);
        setNumTrades(DEFAULT_VALUES.num_trades);
        setResult(null);
    };

    return (
        <TerminalLayout
            title={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
                    <Activity className="h-3.5 w-3.5 text-[#6c8cff]" />
                    <span className="text-xs text-[#8b8f9a]">
                        Monte Carlo Simulation
                    </span>
                </div>
            }
            centerContent={
                result ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
                            <TrendingUp className="h-4 w-4 text-[#6c8cff]" />
                            <span className="text-xs text-[#8b8f9a]">
                                Profit Probability
                            </span>
                            <span
                                className={cn(
                                    "text-lg font-bold font-mono",
                                    result.statistics.profit_probability >= 0.5
                                        ? "text-[#3dd68c]"
                                        : "text-[#f06c6c]"
                                )}
                            >
                                {(
                                    result.statistics.profit_probability * 100
                                ).toFixed(1)}
                                %
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24]/60 border border-[#2d303a]/30">
                            <span className="text-xs text-[#8b8f9a]">
                                Mean ROI
                            </span>
                            <span
                                className={cn(
                                    "text-sm font-semibold",
                                    result.statistics.mean_roi_pct >= 0
                                        ? "text-[#3dd68c]"
                                        : "text-[#f06c6c]"
                                )}
                            >
                                {result.statistics.mean_roi_pct > 0 ? "+" : ""}
                                {result.statistics.mean_roi_pct.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24]/60 border border-[#2d303a]/30">
                        <DollarSign className="h-3.5 w-3.5 text-[#8b8f9a]" />
                        <span className="text-xs text-[#8b8f9a]">Capital:</span>
                        <span className="text-sm font-medium text-[#e8eaed]">
                            ₹{startingCapital.toLocaleString("en-IN")}
                        </span>
                        <Badge
                            variant="outline"
                            className="text-[10px] bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                        >
                            {nSimulations.toLocaleString()} simulations
                        </Badge>
                    </div>
                )
            }
        >
            <div className="flex-1 flex flex-col bg-[#0c0d10] overflow-hidden">
                {/* Input Form */}
                {!result && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="min-h-full flex items-center justify-center p-6">
                            <div className="w-full max-w-2xl my-auto">
                                <div className="rounded-2xl bg-[#12141a] border border-[#2d303a]/50 p-6 shadow-xl">
                                    {/* Header */}
                                    <div className="text-center mb-6">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#6c8cff]/10 border border-[#6c8cff]/20 mb-4">
                                            <LineChart className="h-6 w-6 text-[#6c8cff]" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-[#e8eaed] mb-2">
                                            Monte Carlo Simulation
                                        </h2>
                                        <p className="text-sm text-[#8b8f9a]">
                                            Simulate thousands of trading
                                            outcomes to understand your
                                            strategy&apos;s risk profile
                                        </p>
                                    </div>

                                    {/* Preset Buttons */}
                                    <div className="flex justify-center gap-2 mb-6">
                                        {PRESETS.map((preset) => (
                                            <button
                                                key={preset.name}
                                                onClick={() =>
                                                    applyPreset(preset)
                                                }
                                                className="px-4 py-2 text-xs text-[#8b8f9a] bg-[#1a1d24] border border-[#2d303a]/50 rounded-lg hover:border-[#6c8cff]/50 hover:text-[#e8eaed] transition-colors"
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Input Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {/* Starting Capital */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a]">
                                                <DollarSign className="h-3.5 w-3.5" />
                                                Starting Capital (₹)
                                            </label>
                                            <Input
                                                type="number"
                                                value={startingCapital}
                                                onChange={(e) =>
                                                    setStartingCapital(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                            />
                                            <div className="flex gap-1.5">
                                                {[
                                                    50000, 100000, 500000,
                                                    1000000,
                                                ].map((amt) => (
                                                    <button
                                                        key={amt}
                                                        onClick={() =>
                                                            setStartingCapital(
                                                                amt
                                                            )
                                                        }
                                                        className={cn(
                                                            "flex-1 py-1 text-[10px] rounded border transition-colors",
                                                            startingCapital ===
                                                                amt
                                                                ? "bg-[#6c8cff] border-[#6c8cff] text-white"
                                                                : "bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a] hover:border-[#6c8cff]/50"
                                                        )}
                                                    >
                                                        ₹
                                                        {amt >= 100000
                                                            ? `${amt / 100000}L`
                                                            : `${amt / 1000}K`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Number of Simulations */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a]">
                                                <BarChart3 className="h-3.5 w-3.5" />
                                                Simulations
                                            </label>
                                            <Input
                                                type="number"
                                                value={nSimulations}
                                                onChange={(e) =>
                                                    setNSimulations(
                                                        Math.max(
                                                            100,
                                                            Math.min(
                                                                100000,
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        )
                                                    )
                                                }
                                                min={100}
                                                max={100000}
                                                className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                            />
                                            <div className="flex gap-1.5">
                                                {[500, 1000, 5000, 10000].map(
                                                    (n) => (
                                                        <button
                                                            key={n}
                                                            onClick={() =>
                                                                setNSimulations(
                                                                    n
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex-1 py-1 text-[10px] rounded border transition-colors",
                                                                nSimulations ===
                                                                    n
                                                                    ? "bg-[#6c8cff] border-[#6c8cff] text-white"
                                                                    : "bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a] hover:border-[#6c8cff]/50"
                                                            )}
                                                        >
                                                            {n.toLocaleString()}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Risk Per Trade */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#f06c6c]">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Risk Per Trade (%)
                                            </label>
                                            <Input
                                                type="number"
                                                value={(
                                                    riskPerTrade * 100
                                                ).toFixed(1)}
                                                onChange={(e) =>
                                                    setRiskPerTrade(
                                                        Number(e.target.value) /
                                                            100
                                                    )
                                                }
                                                step={0.5}
                                                min={0.1}
                                                max={20}
                                                className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#f06c6c] focus:ring-1 focus:ring-[#f06c6c]/20"
                                            />
                                            <div className="flex gap-1.5">
                                                {[0.5, 1, 2, 5].map((r) => (
                                                    <button
                                                        key={r}
                                                        onClick={() =>
                                                            setRiskPerTrade(
                                                                r / 100
                                                            )
                                                        }
                                                        className={cn(
                                                            "flex-1 py-1 text-[10px] rounded border transition-colors",
                                                            Math.abs(
                                                                riskPerTrade -
                                                                    r / 100
                                                            ) < 0.001
                                                                ? "bg-[#f06c6c] border-[#f06c6c] text-white"
                                                                : "bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a] hover:border-[#f06c6c]/50"
                                                        )}
                                                    >
                                                        {r}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Risk Reward Ratio */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#3dd68c]">
                                                <Target className="h-3.5 w-3.5" />
                                                Risk:Reward Ratio
                                            </label>
                                            <Input
                                                type="number"
                                                value={riskRewardRatio}
                                                onChange={(e) =>
                                                    setRiskRewardRatio(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                step={0.1}
                                                min={0.5}
                                                max={10}
                                                className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#3dd68c] focus:ring-1 focus:ring-[#3dd68c]/20"
                                            />
                                            <div className="flex gap-1.5">
                                                {[1, 1.5, 2, 3].map((r) => (
                                                    <button
                                                        key={r}
                                                        onClick={() =>
                                                            setRiskRewardRatio(
                                                                r
                                                            )
                                                        }
                                                        className={cn(
                                                            "flex-1 py-1 text-[10px] rounded border transition-colors",
                                                            riskRewardRatio ===
                                                                r
                                                                ? "bg-[#3dd68c] border-[#3dd68c] text-white"
                                                                : "bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a] hover:border-[#3dd68c]/50"
                                                        )}
                                                    >
                                                        1:{r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Win Rate */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#6c8cff]">
                                                <Percent className="h-3.5 w-3.5" />
                                                Win Rate (%)
                                            </label>
                                            <Input
                                                type="number"
                                                value={(winRate * 100).toFixed(
                                                    0
                                                )}
                                                onChange={(e) =>
                                                    setWinRate(
                                                        Number(e.target.value) /
                                                            100
                                                    )
                                                }
                                                step={5}
                                                min={1}
                                                max={99}
                                                className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                            />
                                            <div className="flex gap-1.5">
                                                {[40, 50, 55, 60].map((w) => (
                                                    <button
                                                        key={w}
                                                        onClick={() =>
                                                            setWinRate(w / 100)
                                                        }
                                                        className={cn(
                                                            "flex-1 py-1 text-[10px] rounded border transition-colors",
                                                            Math.abs(
                                                                winRate -
                                                                    w / 100
                                                            ) < 0.01
                                                                ? "bg-[#6c8cff] border-[#6c8cff] text-white"
                                                                : "bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a] hover:border-[#6c8cff]/50"
                                                        )}
                                                    >
                                                        {w}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Number of Trades */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a]">
                                                <Activity className="h-3.5 w-3.5" />
                                                Trades per Simulation
                                            </label>
                                            <Input
                                                type="number"
                                                value={numTrades}
                                                onChange={(e) =>
                                                    setNumTrades(
                                                        Math.max(
                                                            10,
                                                            Math.min(
                                                                5000,
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        )
                                                    )
                                                }
                                                min={10}
                                                max={5000}
                                                className="h-10 text-sm bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff]/20"
                                            />
                                            <div className="flex gap-1.5">
                                                {[50, 100, 200, 500].map(
                                                    (n) => (
                                                        <button
                                                            key={n}
                                                            onClick={() =>
                                                                setNumTrades(n)
                                                            }
                                                            className={cn(
                                                                "flex-1 py-1 text-[10px] rounded border transition-colors",
                                                                numTrades === n
                                                                    ? "bg-[#6c8cff] border-[#6c8cff] text-white"
                                                                    : "bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a] hover:border-[#6c8cff]/50"
                                                            )}
                                                        >
                                                            {n}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Box */}
                                    <div className="flex items-start gap-3 p-3 mb-6 rounded-lg bg-[#1a1d24]/50 border border-[#2d303a]/30">
                                        <Info className="h-4 w-4 text-[#6c8cff] mt-0.5 shrink-0" />
                                        <p className="text-xs text-[#8b8f9a]">
                                            Monte Carlo simulation generates
                                            random trading outcomes based on
                                            your parameters. The results show
                                            the probability distribution of your
                                            portfolio value after the specified
                                            number of trades.
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={mutation.isPending}
                                        className="w-full h-12 text-sm font-medium bg-[#6c8cff] hover:bg-[#5c7ce8] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {mutation.isPending ? (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                <span>
                                                    Running Simulation...
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Play className="h-4 w-4" />
                                                <span>Run Simulation</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-6xl mx-auto px-6 py-6">
                            {/* Header with Reset Button */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant="outline"
                                        className="bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                                    >
                                        <BarChart3 className="h-3 w-3 mr-1" />
                                        {result.input_parameters.n_simulations.toLocaleString()}{" "}
                                        simulations
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                                    >
                                        <Activity className="h-3 w-3 mr-1" />
                                        {
                                            result.input_parameters.num_trades
                                        }{" "}
                                        trades each
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                                    >
                                        <DollarSign className="h-3 w-3 mr-1" />₹
                                        {result.input_parameters.starting_capital.toLocaleString(
                                            "en-IN"
                                        )}
                                    </Badge>
                                </div>
                                <Button
                                    onClick={resetToDefaults}
                                    variant="outline"
                                    className="h-9 px-4 text-xs bg-[#1a1d24] border-[#2d303a]/50 text-[#e8eaed] hover:bg-[#252730] hover:border-[#6c8cff]/50"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                    New Simulation
                                </Button>
                            </div>

                            <SimulationResults result={result} />
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(139, 143, 154, 0.2);
                    border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(139, 143, 154, 0.35);
                }
            `}</style>
        </TerminalLayout>
    );
}

// Results Component
function SimulationResults({ result }: { result: SimulateResponse }) {
    const stats = result.statistics;
    const curves = result.equity_curve_percentiles;
    const params = result.input_parameters;

    return (
        <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Profit Probability"
                    value={`${(stats.profit_probability * 100).toFixed(1)}%`}
                    trend={stats.profit_probability >= 0.5 ? "up" : "down"}
                    icon={<TrendingUp className="h-4 w-4 text-[#3dd68c]" />}
                />
                <StatCard
                    label="Mean Final Equity"
                    value={`₹${stats.mean_final_equity.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                    })}`}
                    change={stats.mean_roi_pct}
                    icon={<DollarSign className="h-4 w-4 text-[#6c8cff]" />}
                />
                <StatCard
                    label="Mean Max Drawdown"
                    value={`${stats.mean_max_drawdown_pct.toFixed(1)}%`}
                    trend="down"
                    icon={<TrendingDown className="h-4 w-4 text-[#f06c6c]" />}
                />
                <StatCard
                    label="Ruin Probability"
                    value={`${(stats.ruin_probability * 100).toFixed(2)}%`}
                    trend={stats.ruin_probability < 0.05 ? "up" : "down"}
                    icon={<AlertTriangle className="h-4 w-4 text-[#fbbf24]" />}
                />
            </div>

            {/* Equity Curve Chart */}
            <div className="p-6 bg-[#12141a] rounded-xl border border-[#2d303a]/50">
                <h3 className="text-sm font-medium text-[#e8eaed] mb-4 flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-[#6c8cff]" />
                    Equity Curve Distribution
                </h3>
                <EquityCurveChart
                    curves={curves}
                    startingCapital={params.starting_capital}
                    numTrades={params.num_trades}
                />
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Return Statistics */}
                <div className="p-6 bg-[#12141a] rounded-xl border border-[#2d303a]/50">
                    <h3 className="text-sm font-medium text-[#e8eaed] mb-4">
                        Return Statistics
                    </h3>
                    <div className="space-y-3">
                        <StatRow
                            label="Mean ROI"
                            value={`${stats.mean_roi_pct.toFixed(2)}%`}
                            positive={stats.mean_roi_pct >= 0}
                        />
                        <StatRow
                            label="Max ROI"
                            value={`${stats.max_roi_pct.toFixed(2)}%`}
                            positive={stats.max_roi_pct >= 0}
                        />
                        <StatRow
                            label="Min Final Equity"
                            value={`₹${stats.min_final_equity.toLocaleString(
                                "en-IN",
                                { maximumFractionDigits: 0 }
                            )}`}
                        />
                        <StatRow
                            label="Max Final Equity"
                            value={`₹${stats.max_final_equity.toLocaleString(
                                "en-IN",
                                { maximumFractionDigits: 0 }
                            )}`}
                        />
                        <StatRow
                            label="Median Final Equity"
                            value={`₹${stats.median_final_equity.toLocaleString(
                                "en-IN",
                                { maximumFractionDigits: 0 }
                            )}`}
                        />
                        <StatRow
                            label="Std Dev"
                            value={`₹${stats.std_dev_equity.toLocaleString(
                                "en-IN",
                                { maximumFractionDigits: 0 }
                            )}`}
                        />
                    </div>
                </div>

                {/* Drawdown Statistics */}
                <div className="p-6 bg-[#12141a] rounded-xl border border-[#2d303a]/50">
                    <h3 className="text-sm font-medium text-[#e8eaed] mb-4">
                        Drawdown Analysis
                    </h3>
                    <div className="space-y-3">
                        <StatRow
                            label="Mean Max Drawdown"
                            value={`${stats.mean_max_drawdown_pct.toFixed(2)}%`}
                            negative
                        />
                        <StatRow
                            label="Median Max Drawdown"
                            value={`${stats.median_max_drawdown_pct.toFixed(
                                2
                            )}%`}
                            negative
                        />
                        <StatRow
                            label="Worst Max Drawdown"
                            value={`${stats.worst_max_drawdown_pct.toFixed(
                                2
                            )}%`}
                            negative
                        />
                    </div>

                    {/* Input Parameters Summary */}
                    <div className="mt-6 pt-4 border-t border-[#2d303a]/50">
                        <h4 className="text-xs font-medium text-[#8b8f9a] mb-3">
                            Input Parameters
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-[#8b8f9a]">
                                    Risk/Trade:
                                </span>
                                <span className="text-[#e8eaed]">
                                    {params.risk_per_trade_pct.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#8b8f9a]">
                                    R:R Ratio:
                                </span>
                                <span className="text-[#e8eaed]">
                                    1:{params.risk_reward_ratio}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#8b8f9a]">
                                    Win Rate:
                                </span>
                                <span className="text-[#e8eaed]">
                                    {(params.win_rate * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#8b8f9a]">Trades:</span>
                                <span className="text-[#e8eaed]">
                                    {params.num_trades}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    label,
    value,
    change,
    trend,
    icon,
}: {
    label: string;
    value: string;
    change?: number;
    trend?: "up" | "down";
    icon?: React.ReactNode;
}) {
    return (
        <div className="p-4 bg-[#12141a] rounded-xl border border-[#2d303a]/50">
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-[#8b8f9a]">{label}</span>
                {icon}
            </div>
            <div className="text-xl font-bold text-[#e8eaed] font-mono">
                {value}
            </div>
            {change !== undefined && (
                <div
                    className={cn(
                        "text-xs mt-1",
                        change >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
                    )}
                >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(2)}% from initial
                </div>
            )}
        </div>
    );
}

// Stat Row Component
function StatRow({
    label,
    value,
    positive,
    negative,
}: {
    label: string;
    value: string;
    positive?: boolean;
    negative?: boolean;
}) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs text-[#8b8f9a]">{label}</span>
            <span
                className={cn(
                    "text-sm font-mono",
                    positive && "text-[#3dd68c]",
                    negative && "text-[#f06c6c]",
                    !positive && !negative && "text-[#e8eaed]"
                )}
            >
                {value}
            </span>
        </div>
    );
}

// Equity Curve Chart Component
function EquityCurveChart({
    curves,
    startingCapital,
    numTrades,
}: {
    curves: SimulateEquityCurves;
    startingCapital: number;
    numTrades: number;
}) {
    const chartData = useMemo(() => {
        // Get all values to determine scale
        const allValues = [
            ...curves.p5,
            ...curves.p25,
            ...curves.p50,
            ...curves.p75,
            ...curves.p95,
            ...curves.best_case,
            ...curves.worst_case,
        ];

        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const range = maxValue - minValue || 1;
        const padding = range * 0.1;

        return {
            min: minValue - padding,
            max: maxValue + padding,
            range: maxValue - minValue + padding * 2,
        };
    }, [curves]);

    const svgWidth = 1000;
    const svgHeight = 300;
    const yAxisWidth = 80;
    const xAxisHeight = 30;

    const getY = (value: number) => {
        return ((chartData.max - value) / chartData.range) * svgHeight;
    };

    const getX = (index: number, total: number) => {
        if (total <= 1) return yAxisWidth;
        return yAxisWidth + (index / (total - 1)) * (svgWidth - yAxisWidth);
    };

    const createPath = (data: number[]) => {
        return data
            .map((value, index) => {
                const x = getX(index, data.length);
                const y = getY(value);
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
    };

    const lines = [
        {
            data: curves.worst_case,
            color: "#f06c6c",
            label: "Worst Case",
            dash: "4 4",
        },
        {
            data: curves.p5,
            color: "#fbbf24",
            label: "5th Percentile",
            opacity: 0.7,
        },
        {
            data: curves.p25,
            color: "#8b8f9a",
            label: "25th Percentile",
            opacity: 0.7,
        },
        {
            data: curves.p50,
            color: "#6c8cff",
            label: "Median (50th)",
            width: 2.5,
        },
        {
            data: curves.p75,
            color: "#8b8f9a",
            label: "75th Percentile",
            opacity: 0.7,
        },
        {
            data: curves.p95,
            color: "#3dd68c",
            label: "95th Percentile",
            opacity: 0.7,
        },
        {
            data: curves.best_case,
            color: "#3dd68c",
            label: "Best Case",
            dash: "4 4",
        },
    ];

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4">
                {lines.map((line) => (
                    <div key={line.label} className="flex items-center gap-2">
                        <div
                            className="w-6 h-0.5 rounded-full"
                            style={{
                                backgroundColor: line.color,
                                opacity: line.opacity || 1,
                                ...(line.dash && {
                                    borderTop: `2px dashed ${line.color}`,
                                    background: "transparent",
                                }),
                            }}
                        />
                        <span className="text-[10px] text-[#8b8f9a]">
                            {line.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: 350 }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${svgWidth} ${svgHeight + xAxisHeight}`}
                    preserveAspectRatio="xMidYMid meet"
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
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Initial capital line */}
                    <line
                        x1={yAxisWidth}
                        y1={getY(startingCapital)}
                        x2={svgWidth}
                        y2={getY(startingCapital)}
                        stroke="#8b8f9a"
                        strokeWidth="1"
                        strokeDasharray="8 4"
                    />

                    {/* Confidence band (25th to 75th percentile) */}
                    <path
                        d={`${createPath(curves.p25)} ${curves.p75
                            .slice()
                            .reverse()
                            .map((value, index) => {
                                const x = getX(
                                    curves.p75.length - 1 - index,
                                    curves.p75.length
                                );
                                const y = getY(value);
                                return `L ${x} ${y}`;
                            })
                            .join(" ")} Z`}
                        fill="#6c8cff"
                        fillOpacity="0.1"
                    />

                    {/* Lines */}
                    {lines.map((line) => (
                        <path
                            key={line.label}
                            d={createPath(line.data)}
                            fill="none"
                            stroke={line.color}
                            strokeWidth={line.width || 1.5}
                            strokeOpacity={line.opacity || 1}
                            strokeDasharray={line.dash || "none"}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}

                    {/* Y-axis labels */}
                    <text
                        x="5"
                        y="15"
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                    >
                        ₹
                        {chartData.max.toLocaleString("en-IN", {
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
                        {((chartData.max + chartData.min) / 2).toLocaleString(
                            "en-IN",
                            { maximumFractionDigits: 0 }
                        )}
                    </text>
                    <text
                        x="5"
                        y={svgHeight - 5}
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                    >
                        ₹
                        {chartData.min.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                        })}
                    </text>

                    {/* X-axis labels */}
                    <text
                        x={yAxisWidth}
                        y={svgHeight + 20}
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                        textAnchor="start"
                    >
                        Trade 0
                    </text>
                    <text
                        x={svgWidth / 2}
                        y={svgHeight + 20}
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                        textAnchor="middle"
                    >
                        Trade {Math.floor(numTrades / 2)}
                    </text>
                    <text
                        x={svgWidth - 5}
                        y={svgHeight + 20}
                        fill="#8b8f9a"
                        fontSize="11"
                        fontFamily="monospace"
                        textAnchor="end"
                    >
                        Trade {numTrades}
                    </text>
                </svg>
            </div>
        </div>
    );
}

