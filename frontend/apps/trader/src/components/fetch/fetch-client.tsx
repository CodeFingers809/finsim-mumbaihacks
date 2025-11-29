"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, FileText, ExternalLink, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TerminalLayout } from "@/components/layout/terminal-layout";
import { Badge } from "@/components/ui/badge";
import { FetchAgenticLoader } from "./fetch-agentic-loader";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [isResultReady, setIsResultReady] = useState(false);

    const fetchMutation = useMutation({
        mutationFn: () => fetchDocuments(query, topK),
        onSuccess: () => {
            setIsResultReady(true);
        },
        onError: () => {
            setShowResults(true);
            setIsResultReady(false);
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setSearchQuery(query);
            setShowResults(false);
            setIsResultReady(false);
            fetchMutation.mutate();
        }
    };

    const handleViewResults = useCallback(() => {
        setShowResults(true);
    }, []);

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
                fetchMutation.data &&
                showResults && (
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
                    {/* Agentic Loader */}
                    {(fetchMutation.isPending ||
                        (isResultReady && !showResults)) && (
                        <div className="flex items-center justify-center py-12">
                            <FetchAgenticLoader
                                isLoading={fetchMutation.isPending}
                                isResultReady={isResultReady}
                                onViewResults={handleViewResults}
                                query={searchQuery}
                                topK={topK}
                            />
                        </div>
                    )}

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

                    {!fetchMutation.data &&
                        !fetchMutation.isError &&
                        !fetchMutation.isPending && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <FileText className="h-16 w-16 text-[#2d303a] mb-4" />
                                <h3 className="text-lg font-medium text-[#8b8f9a]">
                                    Search Financial Documents
                                </h3>
                                <p className="text-sm text-[#6b6f7a] mt-2 max-w-md">
                                    Use natural language to search through the
                                    financial data lake. Find insights about
                                    companies, revenue trends, market analysis,
                                    and more.
                                </p>
                            </div>
                        )}

                    {fetchMutation.data && showResults && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-[#8b8f9a]">
                                <span>
                                    Showing {fetchMutation.data.num_results}{" "}
                                    results for &quot;{fetchMutation.data.query}
                                    &quot;
                                </span>
                            </div>

                            {/* Database Table */}
                            <div className="rounded-lg border border-[#2d303a]/60 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#1a1d24] border-b border-[#2d303a]/60">
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-[#8b8f9a] uppercase tracking-wider w-12">
                                                #
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-[#8b8f9a] uppercase tracking-wider w-20">
                                                Score
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-[#8b8f9a] uppercase tracking-wider w-24">
                                                Code
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-[#8b8f9a] uppercase tracking-wider">
                                                Text
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-[#8b8f9a] uppercase tracking-wider min-w-[200px]">
                                                URL
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2d303a]/40">
                                        {fetchMutation.data.documents.map(
                                            (doc, index) => (
                                                <DocumentRow
                                                    key={`${doc.code}-${index}`}
                                                    document={doc}
                                                    rank={index + 1}
                                                />
                                            )
                                        )}
                                    </tbody>
                                </table>
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

function DocumentRow({ document, rank }: { document: Document; rank: number }) {
    const scorePercent = Math.round(document.score * 100);
    const scoreColor =
        scorePercent >= 80
            ? "text-[#3dd68c]"
            : scorePercent >= 60
            ? "text-[#f0c96c]"
            : "text-[#8b8f9a]";

    // Truncate text to ~100 characters
    const truncatedText =
        document.text.length > 100
            ? document.text.slice(0, 100) + "..."
            : document.text;

    return (
        <tr className="bg-[#12141a] hover:bg-[#1a1d24]/80 transition-colors">
            <td className="px-3 py-3 text-[#8b8f9a] font-mono text-center">
                {rank}
            </td>
            <td className="px-3 py-3">
                <span className={cn("font-mono font-medium", scoreColor)}>
                    {scorePercent}%
                </span>
            </td>
            <td className="px-3 py-3">
                {document.code ? (
                    <Badge
                        variant="outline"
                        className="text-xs bg-[#6c8cff]/10 border-[#6c8cff]/30 text-[#6c8cff]"
                    >
                        {document.code}
                    </Badge>
                ) : (
                    <span className="text-[#6b6f7a]">—</span>
                )}
            </td>
            <td className="px-3 py-3 text-[#c8cad0] max-w-md">
                <span title={document.text} className="block truncate">
                    {truncatedText}
                </span>
            </td>
            <td className="px-3 py-3">
                {document.url ? (
                    <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#6c8cff] hover:text-[#5a7ae6] hover:underline transition-colors text-xs break-all"
                    >
                        <span>{document.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                ) : (
                    <span className="text-[#6b6f7a]">—</span>
                )}
            </td>
        </tr>
    );
}

