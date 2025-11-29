"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ChevronDown,
    CheckCircle2,
    Loader2,
    Circle,
    Sparkles,
    Zap,
    RefreshCw,
    Brain,
    FileSearch,
    Target,
    Lightbulb,
    ArrowRight,
    GitBranch,
    MessageSquare,
    Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export interface AgentStep {
    step_type: string;
    title: string;
    description: string;
    data?: Record<string, unknown>;
    timestamp_ms: number;
    status?: "pending" | "in-progress" | "completed";
}

export interface DataPoint {
    label: string;
    value: string;
    unit?: string;
    trend?: "up" | "down" | "stable";
}

export interface AgenticDocument {
    title: string;
    description: string;
    relevance_score: number;
    data_points: DataPoint[];
    key_quote: string;
    highlights: string[];
    snippet: string;
    non_technical_insight: string;
    actionable_takeaway: string;
    source_url: string;
    source_code: string;
    confidence: number;
    full_text?: string;
}

export interface AgenticResult {
    original_query: string;
    interpreted_intent: string;
    expanded_queries: string[];
    sub_questions: string[];
    step_back_question: string;

    executive_summary: string;
    key_metrics: DataPoint[];
    main_insight: string;
    risk_factors: string[];
    opportunities: string[];

    documents: AgenticDocument[];

    total_time_ms: number;
    num_iterations: number;
    confidence_score: number;
}

interface AgenticRagLoaderProps {
    isLoading: boolean;
    steps: AgentStep[];
    result: AgenticResult | null;
    error: string | null;
    onViewResults: () => void;
    query: string;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
    query_expansion: <RefreshCw className="h-4 w-4" />,
    query_expansion_done: <RefreshCw className="h-4 w-4" />,
    decomposition: <GitBranch className="h-4 w-4" />,
    decomposition_done: <GitBranch className="h-4 w-4" />,
    step_back: <ArrowRight className="h-4 w-4 rotate-180" />,
    step_back_done: <ArrowRight className="h-4 w-4 rotate-180" />,
    hyde: <Wand2 className="h-4 w-4" />,
    hyde_done: <Wand2 className="h-4 w-4" />,
    retrieval: <FileSearch className="h-4 w-4" />,
    retrieval_done: <FileSearch className="h-4 w-4" />,
    insight_extraction: <Lightbulb className="h-4 w-4" />,
    insight_extraction_done: <Lightbulb className="h-4 w-4" />,
    summarization: <MessageSquare className="h-4 w-4" />,
    complete: <Sparkles className="h-4 w-4" />,
};

const STEP_COLORS: Record<string, string> = {
    query_expansion: "text-blue-400",
    query_expansion_done: "text-blue-400",
    decomposition: "text-purple-400",
    decomposition_done: "text-purple-400",
    step_back: "text-orange-400",
    step_back_done: "text-orange-400",
    hyde: "text-pink-400",
    hyde_done: "text-pink-400",
    retrieval: "text-cyan-400",
    retrieval_done: "text-cyan-400",
    insight_extraction: "text-yellow-400",
    insight_extraction_done: "text-yellow-400",
    summarization: "text-emerald-400",
    complete: "text-green-400",
};

export function AgenticRagLoader({
    isLoading,
    steps,
    result,
    error,
    onViewResults,
    query,
}: AgenticRagLoaderProps) {
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
    const [isBoosting, setIsBoosting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest step
    useEffect(() => {
        if (scrollRef.current && steps.length > 0) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [steps]);

    // Auto-expand new steps
    useEffect(() => {
        if (steps.length > 0) {
            setExpandedSteps((prev) => {
                const newSet = new Set(prev);
                newSet.add(steps.length - 1);
                return newSet;
            });
        }
    }, [steps.length]);

    const handleBoost = useCallback(() => {
        setIsBoosting(true);
        setTimeout(() => {
            onViewResults();
        }, 600);
    }, [onViewResults]);

    const toggleExpand = (index: number) => {
        setExpandedSteps((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const getStepIcon = (step: AgentStep, index: number, isLast: boolean) => {
        const isCompleted = !isLast || result !== null;
        const isInProgress = isLast && isLoading && !result;

        if (isCompleted) {
            return <CheckCircle2 className="h-4 w-4 text-[#3dd68c] shrink-0" />;
        }
        if (isInProgress) {
            return (
                <Loader2 className="h-4 w-4 text-[#6c8cff] animate-spin shrink-0" />
            );
        }
        return <Circle className="h-4 w-4 text-[#8b8f9a]/40 shrink-0" />;
    };

    const renderStepData = (step: AgentStep) => {
        const data = step.data;
        if (!data || Object.keys(data).length === 0) return null;

        const searchTerms = data.search_terms as string[] | undefined;
        const terms = data.terms as string[] | undefined;
        const score = data.score as number | undefined;
        const missing = data.missing as string[] | undefined;
        const keyFindings = data.key_findings as string[] | undefined;

        return (
            <div className="mt-2 space-y-1">
                {searchTerms && searchTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {searchTerms.map((term, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-full bg-[#6c8cff]/20 text-[#6c8cff]"
                            >
                                {term}
                            </span>
                        ))}
                    </div>
                )}
                {terms && terms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {terms.map((term, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-full bg-[#6c8cff]/20 text-[#6c8cff]"
                            >
                                {term}
                            </span>
                        ))}
                    </div>
                )}
                {typeof score === "number" && (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#2d303a] rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    score >= 0.7
                                        ? "bg-[#3dd68c]"
                                        : score >= 0.5
                                        ? "bg-[#f0c96c]"
                                        : "bg-[#f06c6c]"
                                )}
                                style={{ width: `${score * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-[#8b8f9a] font-mono">
                            {Math.round(score * 100)}%
                        </span>
                    </div>
                )}
                {missing && missing.length > 0 && (
                    <div className="text-xs text-[#f0c96c]">
                        Missing: {missing.join(", ")}
                    </div>
                )}
                {keyFindings && keyFindings.length > 0 && (
                    <div className="space-y-1 mt-2">
                        {keyFindings.slice(0, 3).map((finding, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 text-xs"
                            >
                                <ArrowRight className="h-3 w-3 text-[#3dd68c] mt-0.5 shrink-0" />
                                <span className="text-[#c8cad0]">
                                    {finding}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (error) {
        return (
            <div className="w-full max-w-lg mx-auto">
                <div className="rounded-2xl bg-[#12141a] border border-[#f06c6c]/50 overflow-hidden p-6">
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-[#f06c6c]/20 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">❌</span>
                        </div>
                        <h3 className="text-lg font-semibold text-[#e8eaed] mb-2">
                            Search Failed
                        </h3>
                        <p className="text-sm text-[#f06c6c]">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Boosting animation
    if (isBoosting) {
        return (
            <div className="w-full max-w-lg mx-auto">
                <div className="rounded-2xl bg-[#12141a] border border-[#3dd68c]/50 overflow-hidden">
                    <div className="px-8 py-12 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6c8cff] to-[#3dd68c] flex items-center justify-center animate-pulse">
                                <Brain className="h-10 w-10 text-white animate-bounce" />
                            </div>
                            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#6c8cff]/20 to-[#3dd68c]/20 blur-xl animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-[#e8eaed] mb-1">
                                Analysis Complete!
                            </h3>
                            <p className="text-sm text-[#8b8f9a]">
                                {result?.documents.length || 0} documents with
                                insights
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

    if (!isLoading && steps.length === 0 && !result) {
        return null;
    }

    const completedSteps = result
        ? steps.length
        : Math.max(0, steps.length - 1);
    const progress =
        steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="rounded-2xl bg-[#12141a] border border-[#2d303a]/50 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#2d303a]/50 bg-[#1a1d24]/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c8cff]/20 to-[#3dd68c]/20 flex items-center justify-center">
                                    {result ? (
                                        <Sparkles className="h-5 w-5 text-[#3dd68c]" />
                                    ) : (
                                        <Brain className="h-5 w-5 text-[#6c8cff] animate-pulse" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#12141a] flex items-center justify-center">
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-full animate-pulse",
                                            result
                                                ? "bg-[#3dd68c]"
                                                : "bg-[#6c8cff]"
                                        )}
                                    />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[#e8eaed]">
                                    Agentic RAG Pipeline
                                </h3>
                                <p className="text-xs text-[#8b8f9a]">
                                    {result
                                        ? `Completed in ${result.total_time_ms.toFixed(
                                              0
                                          )}ms`
                                        : `Step ${steps.length} • Processing...`}
                                </p>
                            </div>
                        </div>

                        {result && !isBoosting && (
                            <Button
                                onClick={handleBoost}
                                size="sm"
                                className="bg-gradient-to-r from-[#6c8cff] to-[#3dd68c] hover:from-[#5a7ae6] hover:to-[#2cc67a] text-white font-medium gap-2 shadow-lg shadow-[#6c8cff]/20"
                            >
                                <Zap className="h-4 w-4" />
                                <span>View Results</span>
                            </Button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 h-1.5 bg-[#2d303a]/50 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500 ease-out",
                                result
                                    ? "bg-gradient-to-r from-[#3dd68c] to-[#6c8cff]"
                                    : "bg-gradient-to-r from-[#6c8cff] to-[#3dd68c]"
                            )}
                            style={{ width: result ? "100%" : `${progress}%` }}
                        />
                    </div>

                    {/* Query Expansion */}
                    {result &&
                        result.expanded_queries &&
                        result.expanded_queries.length > 0 && (
                            <div className="mt-3 space-y-1">
                                <div className="text-xs text-[#8b8f9a]">
                                    Query Evolution:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 text-xs rounded bg-[#2d303a] text-[#8b8f9a]">
                                        {result.original_query.slice(0, 30)}...
                                    </span>
                                    {result.expanded_queries.map(
                                        (q: string, i: number) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 text-xs rounded bg-[#6c8cff]/20 text-[#6c8cff]"
                                            >
                                                → {q.slice(0, 30)}...
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                </div>

                {/* Steps List */}
                <div
                    ref={scrollRef}
                    className="divide-y divide-[#2d303a]/30 max-h-[350px] overflow-y-auto custom-scrollbar"
                >
                    {steps.map((step, index) => {
                        const isExpanded = expandedSteps.has(index);
                        const isLast = index === steps.length - 1;
                        const isActive = isLast && isLoading && !result;
                        const isCompleted = !isLast || result !== null;
                        const stepColor =
                            STEP_COLORS[step.step_type] || "text-[#8b8f9a]";

                        return (
                            <div
                                key={`${step.step_type}-${index}`}
                                className={cn(
                                    "transition-colors duration-300",
                                    isActive && "bg-[#6c8cff]/5",
                                    isCompleted && "bg-[#3dd68c]/5"
                                )}
                            >
                                <button
                                    onClick={() => toggleExpand(index)}
                                    className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-[#1a1d24]/50 transition-colors"
                                >
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center",
                                            isActive
                                                ? "bg-[#6c8cff]/20"
                                                : isCompleted
                                                ? "bg-[#3dd68c]/20"
                                                : "bg-[#2d303a]"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                stepColor,
                                                isCompleted && "text-[#3dd68c]",
                                                isActive && "text-[#6c8cff]"
                                            )}
                                        >
                                            {STEP_ICONS[step.step_type] || (
                                                <Circle className="h-4 w-4" />
                                            )}
                                        </span>
                                    </div>
                                    {getStepIcon(step, index, isLast)}
                                    <span
                                        className={cn(
                                            "flex-1 text-sm font-medium transition-colors",
                                            isActive && "text-[#6c8cff]",
                                            isCompleted && "text-[#e8eaed]",
                                            !isActive &&
                                                !isCompleted &&
                                                "text-[#8b8f9a]/60"
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                    <span className="text-[10px] text-[#6b6f7a] font-mono">
                                        {step.timestamp_ms.toFixed(0)}ms
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
                                            ? "max-h-48 opacity-100"
                                            : "max-h-0 opacity-0"
                                    )}
                                >
                                    <div className="px-5 pb-3 pl-14">
                                        <p className="text-xs text-[#8b8f9a] leading-relaxed">
                                            {step.description}
                                        </p>
                                        {renderStepData(step)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Loading indicator */}
                    {isLoading && !result && (
                        <div className="px-5 py-3 flex items-center gap-3">
                            <Loader2 className="h-4 w-4 text-[#6c8cff] animate-spin" />
                            <span className="text-xs text-[#8b8f9a]">
                                Processing...
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer with Summary */}
                <div className="px-5 py-3 bg-[#0c0d10] border-t border-[#2d303a]/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {result ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-[#3dd68c]" />
                                        <span className="text-xs text-[#3dd68c]">
                                            {result.documents.length} documents
                                            •{" "}
                                            {Math.round(
                                                result.confidence_score * 100
                                            )}
                                            % confidence
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-[#6c8cff] animate-bounce"
                                                style={{
                                                    animationDelay: `${
                                                        i * 150
                                                    }ms`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-[#8b8f9a]">
                                        &quot;{query.slice(0, 30)}
                                        {query.length > 30 ? "..." : ""}&quot;
                                    </span>
                                </>
                            )}
                        </div>
                        <span className="text-[10px] text-[#8b8f9a]/60 font-mono flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            Agentic RAG
                        </span>
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

