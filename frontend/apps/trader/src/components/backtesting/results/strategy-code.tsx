"use client";

import { Code, ChevronDown, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface StrategyCodeProps {
    code: string;
}

export function StrategyCode({ code }: StrategyCodeProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="bg-[#12141a] border-[#2d303a]/50">
            <CardHeader className="border-b border-[#2d303a]/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-[#f59e0b]" />
                        <CardTitle className="text-[#e8eaed] text-base">
                            Generated Strategy Code
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8b8f9a] bg-[#1a1d24] border border-[#2d303a]/50 rounded-lg hover:text-[#e8eaed] hover:border-[#6c8cff]/50 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-[#3dd68c]" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8b8f9a] bg-[#1a1d24] border border-[#2d303a]/50 rounded-lg hover:text-[#e8eaed] hover:border-[#6c8cff]/50 transition-colors"
                        >
                            <span>{isExpanded ? "Collapse" : "Expand"}</span>
                            <ChevronDown
                                className={cn(
                                    "h-3.5 w-3.5 transition-transform duration-200",
                                    isExpanded && "rotate-180"
                                )}
                            />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div
                    className={cn(
                        "overflow-hidden transition-all duration-500 ease-in-out",
                        isExpanded ? "max-h-[800px]" : "max-h-[200px]"
                    )}
                >
                    <pre className="p-4 text-xs font-mono text-[#e8eaed] overflow-x-auto custom-scrollbar bg-[#0c0d10]">
                        <code>{code}</code>
                    </pre>
                </div>
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#12141a] to-transparent pointer-events-none" />
                )}
            </CardContent>
        </Card>
    );
}

