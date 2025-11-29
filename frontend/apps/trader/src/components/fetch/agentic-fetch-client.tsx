"use client";

import { useState, useCallback, useRef } from "react";
import {
    Search,
    FileText,
    Loader2,
    Zap,
    Brain,
    Settings2,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TerminalLayout } from "@/components/layout/terminal-layout";
import {
    AgenticRagLoader,
    type AgentStep,
    type AgenticResult,
} from "./agentic-rag-loader";
import { AgenticResults } from "./agentic-results";

export function AgenticFetchClient() {
    const [query, setQuery] = useState("");
    const [topK, setTopK] = useState(20);
    const [maxIterations, setMaxIterations] = useState(3);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [steps, setSteps] = useState<AgentStep[]>([]);
    const [result, setResult] = useState<AgenticResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSearch = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!query.trim() || isLoading) return;

            // Reset state
            setIsLoading(true);
            setSteps([]);
            setResult(null);
            setError(null);
            setShowResults(false);
            setSearchQuery(query);

            // Cancel any existing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            try {
                // Use streaming endpoint
                const response = await fetch("/api/agentic-rag/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query,
                        top_k: topK,
                        max_iterations: maxIterations,
                    }),
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "Request failed");
                }

                // Check if it's a streaming response
                const contentType = response.headers.get("content-type");

                if (contentType?.includes("text/event-stream")) {
                    // Process SSE stream
                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();

                    if (!reader) throw new Error("No response body");

                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });

                        // Process complete events
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const data = JSON.parse(line.slice(6));

                                    if (data.type === "step") {
                                        setSteps((prev) => [
                                            ...prev,
                                            data.step,
                                        ]);
                                    } else if (data.type === "result") {
                                        setResult(data.data);
                                    }
                                } catch {
                                    // Skip malformed JSON
                                }
                            }
                        }
                    }
                } else {
                    // Fallback to non-streaming response
                    const data = await response.json();
                    if (data.agent_steps) {
                        setSteps(data.agent_steps);
                    }
                    setResult(data);
                }
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }
                setError(
                    err instanceof Error ? err.message : "An error occurred"
                );
            } finally {
                setIsLoading(false);
            }
        },
        [query, topK, maxIterations, isLoading]
    );

    const handleViewResults = useCallback(() => {
        setShowResults(true);
    }, []);

    return (
        <TerminalLayout
            title={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
                    <Brain className="h-4 w-4 text-[#6c8cff]" />
                    <span className="text-sm font-medium text-[#e8eaed]">
                        Agentic RAG Search
                    </span>
                </div>
            }
            centerContent={
                result &&
                showResults && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
                        <span className="text-xs text-[#8b8f9a]">Results</span>
                        <span className="text-lg font-bold font-mono text-[#e8eaed]">
                            {result.documents.length}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-semibold bg-[#3dd68c]/15 text-[#3dd68c]">
                            <Zap className="h-3 w-3" />
                            {result.total_time_ms.toFixed(0)}ms
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#6c8cff]/15 text-[#6c8cff]">
                            {result.num_iterations} iter
                        </div>
                    </div>
                )
            }
        >
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Header */}
                <div className="px-6 py-4 border-b border-[#2d303a]/40 bg-[#12141a]/50">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8f9a]" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask about financial insights, company analysis, market trends..."
                                    className="w-full pl-10 pr-4 py-3 bg-[#1a1d24] border border-[#2d303a]/60 rounded-lg text-[#e8eaed] placeholder-[#8b8f9a] focus:outline-none focus:border-[#6c8cff]/50 focus:ring-1 focus:ring-[#6c8cff]/30 transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={cn(
                                    "px-3 py-3 rounded-lg border transition-colors flex items-center gap-2",
                                    showAdvanced
                                        ? "bg-[#6c8cff]/10 border-[#6c8cff]/30 text-[#6c8cff]"
                                        : "bg-[#1a1d24] border-[#2d303a]/60 text-[#8b8f9a] hover:border-[#6c8cff]/30"
                                )}
                            >
                                <Settings2 className="h-4 w-4" />
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 transition-transform",
                                        showAdvanced && "rotate-180"
                                    )}
                                />
                            </button>
                            <button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                className={cn(
                                    "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
                                    query.trim() && !isLoading
                                        ? "bg-gradient-to-r from-[#6c8cff] to-[#3dd68c] text-white hover:opacity-90 shadow-md"
                                        : "bg-[#2d303a] text-[#8b8f9a] cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="h-4 w-4" />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Advanced Options */}
                        {showAdvanced && (
                            <div className="flex gap-4 p-4 rounded-lg bg-[#1a1d24]/50 border border-[#2d303a]/40">
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-[#8b8f9a] whitespace-nowrap">
                                        Top K Results:
                                    </label>
                                    <input
                                        type="number"
                                        value={topK}
                                        onChange={(e) =>
                                            setTopK(
                                                Math.min(
                                                    100,
                                                    Math.max(
                                                        1,
                                                        parseInt(
                                                            e.target.value
                                                        ) || 20
                                                    )
                                                )
                                            )
                                        }
                                        min={1}
                                        max={100}
                                        className="w-20 px-3 py-2 bg-[#12141a] border border-[#2d303a]/60 rounded-lg text-[#e8eaed] text-center text-sm focus:outline-none focus:border-[#6c8cff]/50"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-[#8b8f9a] whitespace-nowrap">
                                        Max Iterations:
                                    </label>
                                    <input
                                        type="number"
                                        value={maxIterations}
                                        onChange={(e) =>
                                            setMaxIterations(
                                                Math.min(
                                                    5,
                                                    Math.max(
                                                        1,
                                                        parseInt(
                                                            e.target.value
                                                        ) || 3
                                                    )
                                                )
                                            )
                                        }
                                        min={1}
                                        max={5}
                                        className="w-20 px-3 py-2 bg-[#12141a] border border-[#2d303a]/60 rounded-lg text-[#e8eaed] text-center text-sm focus:outline-none focus:border-[#6c8cff]/50"
                                    />
                                </div>
                                <div className="flex-1 text-xs text-[#6b6f7a]">
                                    More iterations = better quality but slower.
                                    The agent will rewrite queries and re-search
                                    if results aren&apos;t relevant.
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Agentic Loader */}
                    {(isLoading || (result && !showResults)) && (
                        <div className="flex items-center justify-center py-8">
                            <AgenticRagLoader
                                isLoading={isLoading}
                                steps={steps}
                                result={result}
                                error={error}
                                onViewResults={handleViewResults}
                                query={searchQuery}
                            />
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="p-4 bg-[#f06c6c]/10 border border-[#f06c6c]/30 rounded-lg text-[#f06c6c]">
                            <p className="font-medium">Search Failed</p>
                            <p className="text-sm mt-1 opacity-80">{error}</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!result && !error && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6c8cff]/20 to-[#3dd68c]/20 flex items-center justify-center mb-4">
                                <Brain className="h-10 w-10 text-[#6c8cff]" />
                            </div>
                            <h3 className="text-lg font-medium text-[#8b8f9a]">
                                Agentic RAG Search
                            </h3>
                            <p className="text-sm text-[#6b6f7a] mt-2 max-w-md">
                                Ask questions in natural language. The AI agent
                                will rewrite your query, search the financial
                                data lake, check relevance, and extract key
                                insights.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-6 justify-center">
                                {[
                                    "Companies with strong revenue growth",
                                    "Risk factors for tech sector",
                                    "Dividend paying stocks analysis",
                                ].map((example) => (
                                    <button
                                        key={example}
                                        onClick={() => setQuery(example)}
                                        className="px-3 py-1.5 text-xs text-[#6c8cff] bg-[#6c8cff]/10 rounded-full hover:bg-[#6c8cff]/20 transition-colors"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {result && showResults && (
                        <AgenticResults result={result} />
                    )}
                </div>
            </div>

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

