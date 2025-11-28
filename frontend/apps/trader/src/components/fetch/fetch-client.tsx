"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, FileText, ExternalLink, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TerminalLayout } from "@/components/layout/terminal-layout";
import { Badge } from "@/components/ui/badge";

interface Document {
    score: number;
    code: string;
    url: string;
    text: string;
}

interface FetchResponse {
    query: string;
    num_results: number;
    search_time_ms: number;
    documents: Document[];
}

async function fetchDocuments(
    query: string,
    topK: number
): Promise<FetchResponse> {
    const response = await fetch("/api/fetch", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, top_k: topK }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to fetch documents");
    }

    return response.json();
}

export function FetchClient() {
    const [query, setQuery] = useState("");
    const [topK, setTopK] = useState(20);

    const fetchMutation = useMutation({
        mutationFn: () => fetchDocuments(query, topK),
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            fetchMutation.mutate();
        }
    };

    return (
        <TerminalLayout
            title={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
                    <FileText className="h-4 w-4 text-[#6c8cff]" />
                    <span className="text-sm font-medium text-[#e8eaed]">
                        RAG Document Search
                    </span>
                </div>
            }
            centerContent={
                fetchMutation.data && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1d24]/80 border border-[#2d303a]/40">
                        <span className="text-xs text-[#8b8f9a]">Results</span>
                        <span className="text-lg font-bold font-mono text-[#e8eaed]">
                            {fetchMutation.data.num_results}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-semibold bg-[#6c8cff]/15 text-[#6c8cff]">
                            <Zap className="h-3 w-3" />
                            {fetchMutation.data.search_time_ms.toFixed(1)}ms
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
                                    placeholder="Search for financial insights, company data, revenue growth..."
                                    className="w-full pl-10 pr-4 py-3 bg-[#1a1d24] border border-[#2d303a]/60 rounded-lg text-[#e8eaed] placeholder-[#8b8f9a] focus:outline-none focus:border-[#6c8cff]/50 focus:ring-1 focus:ring-[#6c8cff]/30 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-[#8b8f9a]">
                                    Top K:
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
                                                    parseInt(e.target.value) ||
                                                        20
                                                )
                                            )
                                        )
                                    }
                                    min={1}
                                    max={100}
                                    className="w-20 px-3 py-3 bg-[#1a1d24] border border-[#2d303a]/60 rounded-lg text-[#e8eaed] text-center focus:outline-none focus:border-[#6c8cff]/50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={
                                    !query.trim() || fetchMutation.isPending
                                }
                                className={cn(
                                    "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
                                    query.trim() && !fetchMutation.isPending
                                        ? "bg-[#6c8cff] text-white hover:bg-[#5a7ae6] shadow-md"
                                        : "bg-[#2d303a] text-[#8b8f9a] cursor-not-allowed"
                                )}
                            >
                                {fetchMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4" />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {fetchMutation.isError && (
                        <div className="p-4 bg-[#f06c6c]/10 border border-[#f06c6c]/30 rounded-lg text-[#f06c6c]">
                            <p className="font-medium">Search Failed</p>
                            <p className="text-sm mt-1 opacity-80">
                                {fetchMutation.error instanceof Error
                                    ? fetchMutation.error.message
                                    : "An error occurred"}
                            </p>
                        </div>
                    )}

                    {!fetchMutation.data && !fetchMutation.isError && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <FileText className="h-16 w-16 text-[#2d303a] mb-4" />
                            <h3 className="text-lg font-medium text-[#8b8f9a]">
                                Search Financial Documents
                            </h3>
                            <p className="text-sm text-[#6b6f7a] mt-2 max-w-md">
                                Use natural language to search through the
                                financial data lake. Find insights about
                                companies, revenue trends, market analysis, and
                                more.
                            </p>
                        </div>
                    )}

                    {fetchMutation.data && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-[#8b8f9a]">
                                <span>
                                    Showing {fetchMutation.data.num_results}{" "}
                                    results for &quot;{fetchMutation.data.query}
                                    &quot;
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {fetchMutation.data.documents.map(
                                    (doc, index) => (
                                        <DocumentCard
                                            key={`${doc.code}-${index}`}
                                            document={doc}
                                            rank={index + 1}
                                        />
                                    )
                                )}
                            </div>
                        </div>
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

function DocumentCard({
    document,
    rank,
}: {
    document: Document;
    rank: number;
}) {
    const scorePercent = Math.round(document.score * 100);
    const scoreColor =
        scorePercent >= 80
            ? "text-[#3dd68c]"
            : scorePercent >= 60
            ? "text-[#f0c96c]"
            : "text-[#8b8f9a]";

    return (
        <div className="p-4 bg-[#1a1d24] border border-[#2d303a]/60 rounded-lg hover:border-[#6c8cff]/30 transition-all duration-200">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#252730] text-[#8b8f9a] text-sm font-mono">
                        {rank}
                    </span>
                    {document.code && (
                        <Badge
                            variant="outline"
                            className="text-xs bg-[#6c8cff]/10 border-[#6c8cff]/30 text-[#6c8cff]"
                        >
                            {document.code}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-mono", scoreColor)}>
                        {scorePercent}% match
                    </span>
                    {document.url && (
                        <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-[#252730] text-[#8b8f9a] hover:text-[#6c8cff] transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                </div>
            </div>

            <p className="text-sm text-[#c8cad0] leading-relaxed whitespace-pre-wrap">
                {document.text}
            </p>

            {document.url && (
                <p className="mt-3 text-xs text-[#6b6f7a] truncate">
                    {document.url}
                </p>
            )}
        </div>
    );
}

