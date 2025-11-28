"use client";

import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

const sections = [
    {
        title: "Equity",
        marginAvailable: 0,
        marginUsed: 0,
        openingBalance: 0,
    },
    {
        title: "Commodity",
        marginAvailable: 0,
        marginUsed: 0,
        openingBalance: 0,
    },
];

export function AccountSummary() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#6c8cff]" />
                <h3 className="text-sm font-semibold text-[#e8eaed]">
                    Funds Snapshot
                </h3>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {sections.map((section) => (
                    <div
                        key={section.title}
                        className="rounded-xl border border-[#2d303a]/40 bg-[#1a1d24] p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium uppercase tracking-wider text-[#8b8f9a]">
                                {section.title}
                            </span>
                            <span className="text-[10px] text-[#8b8f9a]">
                                Margin available
                            </span>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-bold font-mono text-[#e8eaed]">
                                    ₹
                                    {section.marginAvailable.toLocaleString(
                                        "en-IN"
                                    )}
                                </p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="flex items-center gap-1 justify-end">
                                    <TrendingDown className="h-3 w-3 text-[#f06c6c]" />
                                    <span className="text-[10px] text-[#8b8f9a]">
                                        Used:
                                    </span>
                                    <span className="text-xs font-mono text-[#f06c6c]">
                                        ₹
                                        {section.marginUsed.toLocaleString(
                                            "en-IN"
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 justify-end">
                                    <TrendingUp className="h-3 w-3 text-[#3dd68c]" />
                                    <span className="text-[10px] text-[#8b8f9a]">
                                        Opening:
                                    </span>
                                    <span className="text-xs font-mono text-[#3dd68c]">
                                        ₹
                                        {section.openingBalance.toLocaleString(
                                            "en-IN"
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <button className="w-full py-3 rounded-xl border border-[#6c8cff]/40 bg-[#6c8cff]/10 text-sm font-medium text-[#6c8cff] hover:bg-[#6c8cff]/20 transition-all duration-200">
                Start investing
            </button>
        </div>
    );
}

