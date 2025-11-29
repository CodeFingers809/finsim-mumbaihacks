"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ChevronDown,
    CheckCircle2,
    Loader2,
    Circle,
    Sparkles,
    Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface LoadingStep {
    id: string;
    title: string;
    description: string;
    status: "pending" | "in-progress" | "completed";
}

interface AgenticLoaderProps {
    isLoading: boolean;
    isResultReady: boolean;
    onViewResults: () => void;
    entryStrategy: string;
    exitStrategy: string;
    stocks: string[];
    capital: number;
}

export function AgenticLoader({
    isLoading,
    isResultReady,
    onViewResults,
    entryStrategy,
    exitStrategy,
    stocks,
    capital,
}: AgenticLoaderProps) {
    const [steps, setSteps] = useState<LoadingStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
    const [batchIndex, setBatchIndex] = useState(0);
    const [isFetchingSteps, setIsFetchingSteps] = useState(false);
    const [isBoosting, setIsBoosting] = useState(false);
    const hasInitializedRef = useRef(false);
    const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const allStepsCompleted =
        steps.length > 0 && steps.every((s) => s.status === "completed");

    const getRandomInterval = useCallback(() => {
        return Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000; // 3-8 seconds
    }, []);

    // Fetch loading steps from API
    const fetchLoadingSteps = useCallback(
        async (batch: number) => {
            if (isFetchingSteps) return;
            setIsFetchingSteps(true);

            try {
                const response = await fetch("/api/loading-steps", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        entryStrategy,
                        exitStrategy,
                        stocks,
                        capital,
                        batchIndex: batch,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const newSteps: LoadingStep[] = data.steps.map(
                        (
                            step: { title: string; description: string },
                            idx: number
                        ) => ({
                            id: `step-${batch}-${idx}`,
                            title: step.title,
                            description: step.description,
                            status: "pending" as const,
                        })
                    );

                    setSteps((prev) => {
                        if (batch === 0) {
                            return newSteps;
                        }
                        // Append new steps for continuation
                        return [...prev, ...newSteps];
                    });
                }
            } catch (error) {
                console.error("Failed to fetch loading steps:", error);
            } finally {
                setIsFetchingSteps(false);
            }
        },
        [entryStrategy, exitStrategy, stocks, capital, isFetchingSteps]
    );

    // Initialize on loading start
    useEffect(() => {
        if (isLoading && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            setSteps([]);
            setCurrentStepIndex(0);
            setExpandedSteps(new Set());
            setBatchIndex(0);
            setIsBoosting(false);
            fetchLoadingSteps(0);
        }

        if (!isLoading) {
            hasInitializedRef.current = false;
            if (stepIntervalRef.current) {
                clearTimeout(stepIntervalRef.current);
                stepIntervalRef.current = null;
            }
        }
    }, [isLoading, fetchLoadingSteps]);

    // Auto-trigger boost when all steps complete AND result is ready
    useEffect(() => {
        if (allStepsCompleted && isResultReady && !isBoosting) {
            handleBoost();
        }
    }, [allStepsCompleted, isResultReady]);

    const handleBoost = useCallback(() => {
        setIsBoosting(true);
        // Show boosting animation for 1.5 seconds then show results
        setTimeout(() => {
            onViewResults();
        }, 1500);
    }, [onViewResults]);

    // Progress through steps
    useEffect(() => {
        if (!isLoading || steps.length === 0 || isBoosting) return;

        // Set first step to in-progress if not already
        if (currentStepIndex === 0 && steps[0]?.status === "pending") {
            setSteps((prev) =>
                prev.map((step, idx) =>
                    idx === 0 ? { ...step, status: "in-progress" } : step
                )
            );
            setExpandedSteps(new Set([steps[0].id]));
        }

        const interval = getRandomInterval();
        stepIntervalRef.current = setTimeout(() => {
            // Check if we need more steps (near the end and backtest still running)
            const isNearEnd = currentStepIndex >= steps.length - 2;
            const needMoreSteps =
                isNearEnd && !isResultReady && !isFetchingSteps;

            if (needMoreSteps) {
                const nextBatch = batchIndex + 1;
                setBatchIndex(nextBatch);
                fetchLoadingSteps(nextBatch);
            }

            if (currentStepIndex < steps.length - 1) {
                setSteps((prev) =>
                    prev.map((step, idx) => {
                        if (idx === currentStepIndex) {
                            return { ...step, status: "completed" };
                        }
                        if (idx === currentStepIndex + 1) {
                            return { ...step, status: "in-progress" };
                        }
                        return step;
                    })
                );
                setCurrentStepIndex((prev) => prev + 1);
                setExpandedSteps((prev) => {
                    const newSet = new Set(prev);
                    if (steps[currentStepIndex + 1]) {
                        newSet.add(steps[currentStepIndex + 1].id);
                    }
                    return newSet;
                });
            } else if (currentStepIndex === steps.length - 1) {
                // Complete the last step
                setSteps((prev) =>
                    prev.map((step, idx) =>
                        idx === currentStepIndex
                            ? { ...step, status: "completed" }
                            : step
                    )
                );
            }
        }, interval);

        return () => {
            if (stepIntervalRef.current) {
                clearTimeout(stepIntervalRef.current);
            }
        };
    }, [
        isLoading,
        currentStepIndex,
        steps,
        getRandomInterval,
        isResultReady,
        batchIndex,
        fetchLoadingSteps,
        isFetchingSteps,
        isBoosting,
    ]);

    const toggleExpand = (stepId: string) => {
        setExpandedSteps((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(stepId)) {
                newSet.delete(stepId);
            } else {
                newSet.add(stepId);
            }
            return newSet;
        });
    };

    const getStepIcon = (status: LoadingStep["status"]) => {
        switch (status) {
            case "completed":
                return (
                    <CheckCircle2 className="h-4 w-4 text-[#3dd68c] shrink-0" />
                );
            case "in-progress":
                return (
                    <Loader2 className="h-4 w-4 text-[#6c8cff] animate-spin shrink-0" />
                );
            default:
                return (
                    <Circle className="h-4 w-4 text-[#8b8f9a]/40 shrink-0" />
                );
        }
    };

    if (!isLoading && steps.length === 0) {
        return null;
    }

    const completedCount = steps.filter((s) => s.status === "completed").length;
    const hasInProgress = steps.some((s) => s.status === "in-progress");

    // Boosting animation overlay
    if (isBoosting) {
        return (
            <div className="w-full max-w-lg mx-auto">
                <div className="rounded-2xl bg-[#12141a] border border-[#3dd68c]/50 overflow-hidden">
                    <div className="px-8 py-12 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6c8cff] to-[#3dd68c] flex items-center justify-center animate-pulse">
                                <Rocket className="h-10 w-10 text-white animate-bounce" />
                            </div>
                            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#6c8cff]/20 to-[#3dd68c]/20 blur-xl animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-[#e8eaed] mb-1">
                                Boosting Results...
                            </h3>
                            <p className="text-sm text-[#8b8f9a]">
                                Preparing your backtest insights
                            </p>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-[#3dd68c] animate-bounce"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="rounded-2xl bg-[#12141a] border border-[#2d303a]/50 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#2d303a]/50 bg-[#1a1d24]/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-[#6c8cff]/10 flex items-center justify-center">
                                    {isResultReady ? (
                                        <Sparkles className="h-5 w-5 text-[#3dd68c]" />
                                    ) : (
                                        <Loader2 className="h-5 w-5 text-[#6c8cff] animate-spin" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#12141a] flex items-center justify-center">
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-full animate-pulse",
                                            isResultReady
                                                ? "bg-[#3dd68c]"
                                                : "bg-[#6c8cff]"
                                        )}
                                    />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[#e8eaed]">
                                    Running Backtest
                                </h3>
                                <p className="text-xs text-[#8b8f9a]">
                                    {`Processing step ${Math.min(
                                        currentStepIndex + 1,
                                        steps.length
                                    )} of ${steps.length}${
                                        isFetchingSteps ? "+" : ""
                                    }`}
                                </p>
                            </div>
                        </div>

                        {/* Boost Button - Premium Feature */}
                        {isResultReady && !isBoosting && (
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleBoost}
                                    size="sm"
                                    className="bg-gradient-to-r from-[#f5a623] to-[#f7c948] hover:from-[#e69816] hover:to-[#e6b83d] text-black font-medium gap-2 shadow-lg shadow-[#f5a623]/20"
                                >
                                    <Rocket className="h-4 w-4" />
                                    <span>Boost</span>
                                    <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                                        PRO
                                    </span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 h-1 bg-[#2d303a]/50 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500 ease-out",
                                isResultReady
                                    ? "bg-[#3dd68c]"
                                    : "bg-gradient-to-r from-[#6c8cff] to-[#3dd68c]"
                            )}
                            style={{
                                width: isResultReady
                                    ? "100%"
                                    : `${
                                          ((completedCount +
                                              (hasInProgress ? 0.5 : 0)) /
                                              Math.max(steps.length, 1)) *
                                          100
                                      }%`,
                            }}
                        />
                    </div>
                </div>

                {/* Steps List */}
                <div className="divide-y divide-[#2d303a]/30 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {steps.map((step) => {
                        const isExpanded = expandedSteps.has(step.id);
                        const isActive = step.status === "in-progress";
                        const isCompleted = step.status === "completed";

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "transition-colors duration-300",
                                    isActive && "bg-[#6c8cff]/5",
                                    isCompleted && "bg-[#3dd68c]/5"
                                )}
                            >
                                <button
                                    onClick={() => toggleExpand(step.id)}
                                    className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-[#1a1d24]/50 transition-colors"
                                >
                                    {getStepIcon(step.status)}
                                    <span
                                        className={cn(
                                            "flex-1 text-sm font-medium transition-colors",
                                            isActive && "text-[#6c8cff]",
                                            isCompleted && "text-[#3dd68c]",
                                            step.status === "pending" &&
                                                "text-[#8b8f9a]/60"
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 text-[#8b8f9a] transition-transform duration-200",
                                            isExpanded && "rotate-180"
                                        )}
                                    />
                                </button>
                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        isExpanded
                                            ? "max-h-32 opacity-100"
                                            : "max-h-0 opacity-0"
                                    )}
                                >
                                    <div className="px-5 pb-3 pl-12">
                                        <p className="text-xs text-[#8b8f9a] leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Loading more steps indicator */}
                    {isFetchingSteps && (
                        <div className="px-5 py-3 flex items-center gap-3">
                            <Loader2 className="h-4 w-4 text-[#6c8cff] animate-spin" />
                            <span className="text-xs text-[#8b8f9a]">
                                Generating more analysis steps...
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-[#0c0d10] border-t border-[#2d303a]/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isResultReady ? (
                                <>
                                    <Rocket className="h-4 w-4 text-[#f5a623]" />
                                    <span className="text-xs text-[#f5a623]">
                                        Skip the wait with Boost
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-1">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full bg-[#6c8cff] animate-bounce"
                                            style={{ animationDelay: "0ms" }}
                                        />
                                        <div
                                            className="w-1.5 h-1.5 rounded-full bg-[#6c8cff] animate-bounce"
                                            style={{ animationDelay: "150ms" }}
                                        />
                                        <div
                                            className="w-1.5 h-1.5 rounded-full bg-[#6c8cff] animate-bounce"
                                            style={{ animationDelay: "300ms" }}
                                        />
                                    </div>
                                    <span className="text-xs text-[#8b8f9a]">
                                        {stocks.length > 0
                                            ? `Analyzing ${stocks[0].replace(
                                                  ".NS",
                                                  ""
                                              )}${
                                                  stocks.length > 1
                                                      ? ` +${stocks.length - 1}`
                                                      : ""
                                              }...`
                                            : "Processing your strategy..."}
                                    </span>
                                </>
                            )}
                        </div>
                        <span className="text-[10px] text-[#8b8f9a]/60 font-mono">
                            Powered by Agentic AI
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

