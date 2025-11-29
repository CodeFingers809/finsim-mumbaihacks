"use client";

import { useState } from "react";
import {
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Quote,
    Copy,
    Check,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Target,
    Brain,
    Zap,
    ArrowUpRight,
    Shield,
    Rocket,
    BarChart3,
    MessageSquare,
    GitBranch,
    FileText,
    Highlighter,
    Sparkles,
    Hash,
    Link2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import type {
    AgenticDocument,
    AgenticResult,
    DataPoint,
} from "./agentic-rag-loader";

interface AgenticResultsProps {
    result: AgenticResult;
}

function TrendIcon({ trend }: { trend?: string }) {
    if (trend === "up")
        return <TrendingUp className="h-3.5 w-3.5 text-[#3dd68c]" />;
    if (trend === "down")
        return <TrendingDown className="h-3.5 w-3.5 text-[#f06c6c]" />;
    return <Minus className="h-3.5 w-3.5 text-[#8b8f9a]" />;
}

function MetricCard({ metric }: { metric: DataPoint }) {
    const trendColor =
        metric.trend === "up"
            ? "border-[#3dd68c]/30 bg-[#3dd68c]/5"
            : metric.trend === "down"
            ? "border-[#f06c6c]/30 bg-[#f06c6c]/5"
            : "border-[#2d303a] bg-[#1a1d24]";

    return (
        <div
            className={cn(
                "rounded-xl border p-4 transition-all hover:scale-[1.02]",
                trendColor
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8b8f9a] uppercase tracking-wide">
                    {metric.label}
                </span>
                <TrendIcon trend={metric.trend} />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#e8eaed]">
                    {metric.value}
                </span>
                {metric.unit && (
                    <span className="text-sm text-[#8b8f9a]">
                        {metric.unit}
                    </span>
                )}
            </div>
        </div>
    );
}

// Helper to render text with **bold** markers as highlighted spans
function HighlightedText({ text }: { text: string }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <span
                            key={i}
                            className="bg-[#f0c96c]/20 text-[#f0c96c] px-1 rounded font-medium"
                        >
                            {part.slice(2, -2)}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

// Relevance score bar
function RelevanceBar({ score }: { score: number }) {
    const percentage = Math.min(100, Math.max(0, score * 100));
    const color =
        percentage >= 70 ? "#3dd68c" : percentage >= 50 ? "#f0c96c" : "#f06c6c";

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#2d303a] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-[10px] font-mono" style={{ color }}>
                {percentage.toFixed(0)}%
            </span>
        </div>
    );
}

export function AgenticResults({ result }: AgenticResultsProps) {
    const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set([0]));
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"insights" | "documents">(
        "insights"
    );

    const toggleDoc = (index: number) => {
        setExpandedDocs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Executive Summary Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-[#6c8cff]/10 via-[#3dd68c]/5 to-[#f0c96c]/10 border border-[#6c8cff]/20 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6c8cff] to-[#3dd68c] flex items-center justify-center shrink-0 shadow-lg shadow-[#6c8cff]/20">
                        <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-lg font-bold text-[#e8eaed]">
                                Executive Summary
                            </h2>
                            <Badge
                                variant="outline"
                                className="text-[10px] bg-[#3dd68c]/10 border-[#3dd68c]/30 text-[#3dd68c]"
                            >
                                {Math.round(result.confidence_score * 100)}%
                                confidence
                            </Badge>
                            <Badge
                                variant="outline"
                                className="text-[10px] bg-[#6c8cff]/10 border-[#6c8cff]/30 text-[#6c8cff]"
                            >
                                <Zap className="h-3 w-3 mr-1" />
                                {result.total_time_ms.toFixed(0)}ms
                            </Badge>
                        </div>
                        <p className="text-base text-[#c8cad0] leading-relaxed mb-4">
                            {result.executive_summary || "Analysis complete."}
                        </p>

                        {/* Main Insight Highlight */}
                        {result.main_insight && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f0c96c]/10 border border-[#f0c96c]/30">
                                <Lightbulb className="h-5 w-5 text-[#f0c96c] mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-xs text-[#f0c96c] font-medium uppercase tracking-wide mb-1">
                                        Key Insight
                                    </div>
                                    <p className="text-sm text-[#e8eaed] font-medium">
                                        {result.main_insight}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            {result.key_metrics && result.key_metrics.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-4 w-4 text-[#6c8cff]" />
                        <h3 className="text-sm font-semibold text-[#e8eaed]">
                            Key Metrics
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {result.key_metrics.map((metric, i) => (
                            <MetricCard key={i} metric={metric} />
                        ))}
                    </div>
                </div>
            )}

            {/* Risks & Opportunities */}
            {(result.risk_factors?.length > 0 ||
                result.opportunities?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Risks */}
                    {result.risk_factors && result.risk_factors.length > 0 && (
                        <div className="rounded-xl border border-[#f06c6c]/30 bg-[#f06c6c]/5 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="h-4 w-4 text-[#f06c6c]" />
                                <h4 className="text-sm font-semibold text-[#f06c6c]">
                                    Risk Factors
                                </h4>
                            </div>
                            <ul className="space-y-2">
                                {result.risk_factors.map((risk, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-[#c8cad0]"
                                    >
                                        <AlertTriangle className="h-3.5 w-3.5 text-[#f06c6c] mt-0.5 shrink-0" />
                                        <span>{risk}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Opportunities */}
                    {result.opportunities &&
                        result.opportunities.length > 0 && (
                            <div className="rounded-xl border border-[#3dd68c]/30 bg-[#3dd68c]/5 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Rocket className="h-4 w-4 text-[#3dd68c]" />
                                    <h4 className="text-sm font-semibold text-[#3dd68c]">
                                        Opportunities
                                    </h4>
                                </div>
                                <ul className="space-y-2">
                                    {result.opportunities.map((opp, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm text-[#c8cad0]"
                                        >
                                            <ArrowUpRight className="h-3.5 w-3.5 text-[#3dd68c] mt-0.5 shrink-0" />
                                            <span>{opp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                </div>
            )}

            {/* Query Analysis Accordion */}
            <details className="rounded-xl border border-[#2d303a]/50 bg-[#1a1d24]/50 group">
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between text-sm text-[#8b8f9a] hover:text-[#e8eaed] transition-colors">
                    <span className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Query Analysis & Expansion
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 space-y-3 border-t border-[#2d303a]/50 pt-3">
                    {/* Intent */}
                    <div>
                        <div className="text-xs text-[#6b6f7a] mb-1">
                            Interpreted Intent
                        </div>
                        <div className="text-sm text-[#c8cad0]">
                            {result.interpreted_intent}
                        </div>
                    </div>

                    {/* Expanded Queries */}
                    {result.expanded_queries?.length > 0 && (
                        <div>
                            <div className="text-xs text-[#6b6f7a] mb-2">
                                Expanded Queries
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {result.expanded_queries.map((q, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 text-xs rounded-lg bg-[#6c8cff]/10 text-[#6c8cff] border border-[#6c8cff]/20"
                                    >
                                        {q}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sub Questions */}
                    {result.sub_questions?.length > 0 && (
                        <div>
                            <div className="text-xs text-[#6b6f7a] mb-2">
                                Sub-Questions
                            </div>
                            <div className="space-y-1">
                                {result.sub_questions.map((q, i) => (
                                    <div
                                        key={i}
                                        className="text-xs text-[#8b8f9a] flex items-start gap-2"
                                    >
                                        <span className="text-[#6c8cff]">
                                            {i + 1}.
                                        </span>
                                        <span>{q}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step Back Question */}
                    {result.step_back_question && (
                        <div>
                            <div className="text-xs text-[#6b6f7a] mb-1">
                                Step-Back Context
                            </div>
                            <div className="text-xs text-[#8b8f9a] italic">
                                &quot;{result.step_back_question}&quot;
                            </div>
                        </div>
                    )}
                </div>
            </details>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-[#2d303a]/50 pb-2">
                <button
                    onClick={() => setActiveTab("insights")}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        activeTab === "insights"
                            ? "bg-[#6c8cff]/10 text-[#6c8cff] border border-[#6c8cff]/30"
                            : "text-[#8b8f9a] hover:text-[#e8eaed]"
                    )}
                >
                    <Lightbulb className="h-4 w-4 inline-block mr-2" />
                    Insights ({result.documents.length})
                </button>
                <button
                    onClick={() => setActiveTab("documents")}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        activeTab === "documents"
                            ? "bg-[#6c8cff]/10 text-[#6c8cff] border border-[#6c8cff]/30"
                            : "text-[#8b8f9a] hover:text-[#e8eaed]"
                    )}
                >
                    <FileText className="h-4 w-4 inline-block mr-2" />
                    Full Documents
                </button>
            </div>

            {/* Documents Grid or List */}
            {activeTab === "insights" ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {result.documents.map((doc, index) => (
                        <InsightCard
                            key={index}
                            document={doc}
                            rank={index + 1}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {result.documents.map((doc, index) => (
                        <DocumentCard
                            key={index}
                            document={doc}
                            rank={index + 1}
                            isExpanded={expandedDocs.has(index)}
                            onToggle={() => toggleDoc(index)}
                            onCopy={() =>
                                copyToClipboard(doc.full_text || "", index)
                            }
                            isCopied={copiedIndex === index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface InsightCardProps {
    document: AgenticDocument;
    rank: number;
}

function InsightCard({ document, rank }: InsightCardProps) {
    const confidenceColor =
        document.confidence >= 0.8
            ? "text-[#3dd68c]"
            : document.confidence >= 0.6
            ? "text-[#f0c96c]"
            : "text-[#8b8f9a]";

    return (
        <div className="rounded-xl border border-[#2d303a]/50 bg-[#12141a] hover:border-[#6c8cff]/30 transition-all p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-lg bg-[#6c8cff]/10 text-[#6c8cff] text-xs font-bold flex items-center justify-center">
                            {rank}
                        </span>
                        {document.source_code && (
                            <Badge
                                variant="outline"
                                className="text-[10px] bg-[#6c8cff]/10 border-[#6c8cff]/30 text-[#6c8cff]"
                            >
                                {document.source_code}
                            </Badge>
                        )}
                        <span
                            className={cn("text-xs font-mono", confidenceColor)}
                        >
                            {Math.round(document.confidence * 100)}%
                        </span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#e8eaed] line-clamp-2">
                        {document.title}
                    </h4>
                </div>
            </div>

            {/* Relevance Score Bar */}
            <RelevanceBar score={document.relevance_score} />

            {/* Description */}
            <p className="text-xs text-[#8b8f9a] line-clamp-2">
                {document.description}
            </p>

            {/* Snippet Preview */}
            {document.snippet && (
                <div className="p-2 rounded-lg bg-[#0c0d10] border border-[#2d303a]/30">
                    <div className="flex items-center gap-1 text-[10px] text-[#6b6f7a] mb-1">
                        <FileText className="h-3 w-3" />
                        Preview
                    </div>
                    <p className="text-xs text-[#a8aab0] line-clamp-3 italic">
                        {document.snippet}
                    </p>
                </div>
            )}

            {/* Highlights */}
            {document.highlights && document.highlights.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-[#f0c96c]">
                        <Highlighter className="h-3 w-3" />
                        Key Highlights
                    </div>
                    <div className="space-y-1">
                        {document.highlights.slice(0, 3).map((highlight, i) => (
                            <div
                                key={i}
                                className="text-xs text-[#c8cad0] pl-2 border-l border-[#f0c96c]/30"
                            >
                                <HighlightedText text={highlight} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Points */}
            {document.data_points && document.data_points.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {document.data_points.slice(0, 3).map((dp, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1a1d24] border border-[#2d303a]/50"
                        >
                            <TrendIcon trend={dp.trend} />
                            <span className="text-[10px] text-[#8b8f9a]">
                                {dp.label}:
                            </span>
                            <span className="text-xs font-medium text-[#e8eaed]">
                                {dp.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Key Quote */}
            {document.key_quote && (
                <div className="pl-3 border-l-2 border-[#f0c96c]/50 text-xs text-[#c8cad0] italic line-clamp-2">
                    &quot;{document.key_quote}&quot;
                </div>
            )}

            {/* Non-technical Insight */}
            {document.non_technical_insight && (
                <div className="p-3 rounded-lg bg-[#6c8cff]/5 border border-[#6c8cff]/20">
                    <div className="flex items-center gap-1 text-[10px] text-[#6c8cff] font-medium mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Plain English
                    </div>
                    <p className="text-xs text-[#c8cad0] line-clamp-2">
                        {document.non_technical_insight}
                    </p>
                </div>
            )}

            {/* Actionable Takeaway */}
            {document.actionable_takeaway && (
                <div className="flex items-start gap-2 text-xs">
                    <Target className="h-3.5 w-3.5 text-[#3dd68c] mt-0.5 shrink-0" />
                    <span className="text-[#3dd68c]">
                        {document.actionable_takeaway}
                    </span>
                </div>
            )}

            {/* Source Link */}
            {document.source_url && (
                <a
                    href={document.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#6c8cff] hover:underline truncate"
                >
                    <Link2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{document.source_url}</span>
                </a>
            )}
        </div>
    );
}

interface DocumentCardProps {
    document: AgenticDocument;
    rank: number;
    isExpanded: boolean;
    onToggle: () => void;
    onCopy: () => void;
    isCopied: boolean;
}

function DocumentCard({
    document,
    rank,
    isExpanded,
    onToggle,
    onCopy,
    isCopied,
}: DocumentCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border transition-all duration-200",
                isExpanded
                    ? "bg-[#1a1d24] border-[#6c8cff]/30"
                    : "bg-[#12141a] border-[#2d303a]/50 hover:border-[#2d303a]"
            )}
        >
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
            >
                <div className="w-7 h-7 rounded-lg bg-[#2d303a] flex items-center justify-center text-xs font-mono text-[#8b8f9a]">
                    {rank}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#e8eaed] truncate">
                        {document.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-[#8b8f9a] truncate flex-1">
                            {document.description}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                            <div className="w-12 h-1 bg-[#2d303a] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${
                                            document.relevance_score * 100
                                        }%`,
                                        backgroundColor:
                                            document.relevance_score >= 0.7
                                                ? "#3dd68c"
                                                : document.relevance_score >=
                                                  0.5
                                                ? "#f0c96c"
                                                : "#f06c6c",
                                    }}
                                />
                            </div>
                            <span className="text-[10px] text-[#8b8f9a]">
                                {(document.relevance_score * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>
                {document.source_code && (
                    <Badge
                        variant="outline"
                        className="text-xs bg-[#6c8cff]/10 border-[#6c8cff]/30 text-[#6c8cff]"
                    >
                        {document.source_code}
                    </Badge>
                )}
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#8b8f9a]" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-[#8b8f9a]" />
                )}
            </button>

            {/* Expanded Content */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300",
                    isExpanded ? "max-h-[1000px]" : "max-h-0"
                )}
            >
                <div className="px-4 pb-4 space-y-4 border-t border-[#2d303a]/50 pt-4">
                    {/* Snippet */}
                    {document.snippet && (
                        <div className="p-3 rounded-lg bg-[#0c0d10] border border-[#2d303a]/30">
                            <div className="flex items-center gap-1 text-xs text-[#6b6f7a] mb-2">
                                <Sparkles className="h-3.5 w-3.5" />
                                Document Snippet
                            </div>
                            <p className="text-sm text-[#a8aab0] italic leading-relaxed">
                                &quot;{document.snippet}&quot;
                            </p>
                        </div>
                    )}

                    {/* Highlights */}
                    {document.highlights && document.highlights.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 text-xs text-[#f0c96c] mb-2">
                                <Highlighter className="h-3.5 w-3.5" />
                                Key Highlights
                            </div>
                            <div className="space-y-2">
                                {document.highlights.map((highlight, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 p-2 rounded-lg bg-[#f0c96c]/5 border border-[#f0c96c]/20"
                                    >
                                        <Hash className="h-3.5 w-3.5 text-[#f0c96c] mt-0.5 shrink-0" />
                                        <span className="text-sm text-[#c8cad0]">
                                            <HighlightedText text={highlight} />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Non-technical Insight */}
                    {document.non_technical_insight && (
                        <div className="p-3 rounded-lg bg-[#6c8cff]/5 border border-[#6c8cff]/20">
                            <div className="text-xs text-[#6c8cff] font-medium mb-1">
                                What this means
                            </div>
                            <p className="text-sm text-[#c8cad0]">
                                {document.non_technical_insight}
                            </p>
                        </div>
                    )}

                    {/* Data Points */}
                    {document.data_points &&
                        document.data_points.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-xs text-[#8b8f9a] mb-2">
                                    <BarChart3 className="h-3.5 w-3.5" />
                                    Data Points
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {document.data_points.map((dp, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-2 rounded-lg bg-[#0c0d10]"
                                        >
                                            <span className="text-xs text-[#8b8f9a]">
                                                {dp.label}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-medium text-[#e8eaed]">
                                                    {dp.value}
                                                </span>
                                                {dp.unit && (
                                                    <span className="text-xs text-[#6b6f7a]">
                                                        {dp.unit}
                                                    </span>
                                                )}
                                                <TrendIcon trend={dp.trend} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Key Quote */}
                    {document.key_quote && (
                        <div className="pl-4 border-l-2 border-[#f0c96c]/50">
                            <Quote className="h-4 w-4 text-[#f0c96c] mb-1" />
                            <p className="text-sm text-[#e8eaed] italic">
                                &quot;{document.key_quote}&quot;
                            </p>
                        </div>
                    )}

                    {/* Actionable Takeaway */}
                    {document.actionable_takeaway && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#3dd68c]/5 border border-[#3dd68c]/20">
                            <Target className="h-4 w-4 text-[#3dd68c] mt-0.5" />
                            <div>
                                <div className="text-xs text-[#3dd68c] font-medium mb-0.5">
                                    Action Item
                                </div>
                                <p className="text-sm text-[#c8cad0]">
                                    {document.actionable_takeaway}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Full Text */}
                    {document.full_text && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1 text-xs text-[#8b8f9a]">
                                    <FileText className="h-3.5 w-3.5" />
                                    Full Document Text
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCopy();
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#2d303a] transition-colors"
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="h-3 w-3 text-[#3dd68c]" />{" "}
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" /> Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="p-3 rounded-lg bg-[#0c0d10] text-sm text-[#c8cad0] leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                                {document.full_text}
                            </div>
                        </div>
                    )}

                    {/* Source URL */}
                    {document.source_url && (
                        <a
                            href={document.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[#6c8cff] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Link2 className="h-4 w-4" />
                            View Source Document
                        </a>
                    )}
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

