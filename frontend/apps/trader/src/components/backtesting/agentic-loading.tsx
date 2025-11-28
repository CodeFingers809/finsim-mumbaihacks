"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    Loader2,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Cpu,
    Database,
    BarChart3,
    Code2,
    LineChart,
    Brain,
    Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type LoadingStep = {
    title: string;
    description: string;
};

const STEP_ICONS = [
    Brain,
    Code2,
    Database,
    Cpu,
    Rocket,
    BarChart3,
    LineChart,
    Sparkles,
    BarChart3,
    Check,
];

interface AgenticLoadingProps {
    steps: LoadingStep[];
    isLoading: boolean;
}

export function AgenticLoading({ steps, isLoading }: AgenticLoadingProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(
        new Set()
    );
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
        new Set([0])
    );
    const [displayedSteps, setDisplayedSteps] = useState<number[]>([0]);

    // Progress to next step every 3-8 seconds
    useEffect(() => {
        if (!isLoading || currentStepIndex >= steps.length) return;

        const randomDelay = Math.floor(Math.random() * 5000) + 3000; // 3-8 seconds

        const timer = setTimeout(() => {
            // Mark current step as completed
            setCompletedSteps((prev) => new Set([...prev, currentStepIndex]));

            // Move to next step
            const nextIndex = currentStepIndex + 1;
            if (nextIndex < steps.length) {
                setCurrentStepIndex(nextIndex);
                setDisplayedSteps((prev) => [...prev, nextIndex]);
                setExpandedSteps(new Set([nextIndex]));
            }
        }, randomDelay);

        return () => clearTimeout(timer);
    }, [isLoading, currentStepIndex, steps.length]);

    // Reset when loading starts
    useEffect(() => {
        if (isLoading) {
            setCurrentStepIndex(0);
            setCompletedSteps(new Set());
            setExpandedSteps(new Set([0]));
            setDisplayedSteps([0]);
        }
    }, [isLoading]);

    const toggleExpanded = useCallback((index: number) => {
        setExpandedSteps((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    if (!isLoading) return null;

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
                <div className="rounded-2xl bg-[#12141a] border border-[#2d303a]/50 p-6 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6c8cff] to-[#a78bfa] flex items-center justify-center">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            <motion.div
                                className="absolute inset-0 rounded-full bg-[#6c8cff]/20"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#e8eaed]">
                                AI Backtest Agent
                            </h2>
                            <p className="text-sm text-[#8b8f9a]">
                                Processing your strategy...
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-[#8b8f9a] mb-2">
                            <span>Progress</span>
                            <span>
                                {Math.min(completedSteps.size + 1, steps.length)}/
                                {steps.length} steps
                            </span>
                        </div>
                        <div className="h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#6c8cff] via-[#a78bfa] to-[#3dd68c]"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: `${((completedSteps.size + 0.5) / steps.length) * 100}%`,
                                }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Steps List */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        <AnimatePresence mode="popLayout">
                            {displayedSteps.map((stepIndex) => {
                                const step = steps[stepIndex];
                                if (!step) return null;

                                const isCompleted = completedSteps.has(stepIndex);
                                const isCurrent = stepIndex === currentStepIndex && !isCompleted;
                                const isExpanded = expandedSteps.has(stepIndex);
                                const Icon = STEP_ICONS[stepIndex % STEP_ICONS.length];

                                return (
                                    <motion.div
                                        key={stepIndex}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                            "rounded-xl border transition-all duration-300",
                                            isCompleted
                                                ? "bg-[#3dd68c]/5 border-[#3dd68c]/30"
                                                : isCurrent
                                                    ? "bg-[#6c8cff]/10 border-[#6c8cff]/40"
                                                    : "bg-[#1a1d24] border-[#2d303a]/50"
                                        )}
                                    >
                                        <button
                                            onClick={() => toggleExpanded(stepIndex)}
                                            className="w-full px-4 py-3 flex items-center gap-3 text-left"
                                        >
                                            {/* Status Icon */}
                                            <div
                                                className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                                    isCompleted
                                                        ? "bg-[#3dd68c]/20"
                                                        : isCurrent
                                                            ? "bg-[#6c8cff]/20"
                                                            : "bg-[#2d303a]/50"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-4 w-4 text-[#3dd68c]" />
                                                ) : isCurrent ? (
                                                    <Loader2 className="h-4 w-4 text-[#6c8cff] animate-spin" />
                                                ) : (
                                                    <Icon className="h-4 w-4 text-[#8b8f9a]" />
                                                )}
                                            </div>

                                            {/* Step Number & Title */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#8b8f9a]">
                                                        Step {stepIndex + 1}
                                                    </span>
                                                    {isCurrent && (
                                                        <motion.span
                                                            className="px-2 py-0.5 text-[10px] bg-[#6c8cff]/20 text-[#6c8cff] rounded-full"
                                                            animate={{ opacity: [1, 0.5, 1] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                        >
                                                            Processing
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <p
                                                    className={cn(
                                                        "text-sm font-medium truncate",
                                                        isCompleted
                                                            ? "text-[#3dd68c]"
                                                            : isCurrent
                                                                ? "text-[#e8eaed]"
                                                                : "text-[#8b8f9a]"
                                                    )}
                                                >
                                                    {step.title}
                                                </p>
                                            </div>

                                            {/* Expand Icon */}
                                            <div className="flex-shrink-0">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-[#8b8f9a]" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-[#8b8f9a]" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded Description */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-3 pl-[60px]">
                                                        <p className="text-xs text-[#8b8f9a] leading-relaxed">
                                                            {step.description}
                                                        </p>
                                                        {isCurrent && (
                                                            <motion.div
                                                                className="mt-2 flex gap-1"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                            >
                                                                {[0, 1, 2].map((i) => (
                                                                    <motion.div
                                                                        key={i}
                                                                        className="w-1.5 h-1.5 rounded-full bg-[#6c8cff]"
                                                                        animate={{
                                                                            scale: [1, 1.5, 1],
                                                                            opacity: [0.5, 1, 0.5],
                                                                        }}
                                                                        transition={{
                                                                            duration: 1,
                                                                            repeat: Infinity,
                                                                            delay: i * 0.2,
                                                                        }}
                                                                    />
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-[#2d303a]/50">
                        <p className="text-[10px] text-center text-[#8b8f9a]">
                            <Sparkles className="inline h-3 w-3 mr-1 text-[#a78bfa]" />
                            Powered by Gemini AI • Analyzing historical market data
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(139, 143, 154, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(139, 143, 154, 0.35);
                }
            `}</style>
        </div>
    );
}
