"use client";

import type { Analysis } from "@trader/types";
import { CheckCircle2, Lightbulb, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface AIAnalysisProps {
    analysis: Analysis;
}

export function AIAnalysis({ analysis }: AIAnalysisProps) {
    const [isVerificationExpanded, setIsVerificationExpanded] = useState(true);
    const [isRecommendationsExpanded, setIsRecommendationsExpanded] =
        useState(true);

    return (
        <Card className="bg-[#12141a] border-[#2d303a]/50">
            <CardHeader className="border-b border-[#2d303a]/40">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#a78bfa]/10">
                        <Lightbulb className="h-4 w-4 text-[#a78bfa]" />
                    </div>
                    <CardTitle className="text-[#e8eaed] text-base">
                        AI Strategy Analysis
                    </CardTitle>
                    <span className="ml-auto text-[10px] text-[#8b8f9a] bg-[#1a1d24] px-2 py-1 rounded-lg">
                        Powered by Agentic AI
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[#2d303a]/30">
                {/* Verification Section */}
                <div>
                    <button
                        onClick={() =>
                            setIsVerificationExpanded(!isVerificationExpanded)
                        }
                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#1a1d24]/50 transition-colors text-left"
                    >
                        <div className="p-2 rounded-lg bg-[#3dd68c]/10">
                            <CheckCircle2 className="h-4 w-4 text-[#3dd68c]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-[#e8eaed]">
                                Performance Analysis
                            </p>
                            <p className="text-xs text-[#8b8f9a]">
                                What the results indicate
                            </p>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-[#8b8f9a] transition-transform duration-200",
                                isVerificationExpanded && "rotate-180"
                            )}
                        />
                    </button>
                    <div
                        className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            isVerificationExpanded
                                ? "max-h-96 opacity-100"
                                : "max-h-0 opacity-0"
                        )}
                    >
                        <div className="px-6 pb-4">
                            <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#2d303a]/30">
                                <p className="text-sm text-[#e8eaed] leading-relaxed whitespace-pre-wrap">
                                    {analysis.verification}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations Section */}
                <div>
                    <button
                        onClick={() =>
                            setIsRecommendationsExpanded(
                                !isRecommendationsExpanded
                            )
                        }
                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#1a1d24]/50 transition-colors text-left"
                    >
                        <div className="p-2 rounded-lg bg-[#6c8cff]/10">
                            <Lightbulb className="h-4 w-4 text-[#6c8cff]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-[#e8eaed]">
                                Improvement Recommendations
                            </p>
                            <p className="text-xs text-[#8b8f9a]">
                                How to enhance your strategy
                            </p>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-[#8b8f9a] transition-transform duration-200",
                                isRecommendationsExpanded && "rotate-180"
                            )}
                        />
                    </button>
                    <div
                        className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            isRecommendationsExpanded
                                ? "max-h-96 opacity-100"
                                : "max-h-0 opacity-0"
                        )}
                    >
                        <div className="px-6 pb-4">
                            <div className="p-4 rounded-xl bg-[#0c0d10] border border-[#2d303a]/30">
                                <p className="text-sm text-[#e8eaed] leading-relaxed whitespace-pre-wrap">
                                    {analysis.recommendations}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

