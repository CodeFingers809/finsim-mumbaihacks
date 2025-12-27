"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Target,
    FlaskConical,
    FileSearch,
    Activity,
    Grid3X3,
    RotateCcw,
    Maximize2,
    PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TerminalLayoutProps {
    children: ReactNode;
    title?: ReactNode;
    centerContent?: ReactNode;
    rightActions?: ReactNode;
}

export function TerminalLayout({
    children,
    title,
    centerContent,
    rightActions,
}: TerminalLayoutProps) {
    const pathname = usePathname();

    const isResearch = pathname?.includes("/research");
    const isBacktesting = pathname?.includes("/backtesting");
    const isFetch = pathname?.includes("/fetch");
    const isSimulate = pathname?.includes("/simulate");
    const isOptimize = pathname?.includes("/optimize");

    return (
        <div className="fixed inset-0 z-50 bg-[#0c0d10] flex flex-col overflow-hidden">
            {/* Top Toolbar - Consistent across Research and Backtesting */}
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 bg-[#12141a] border-b border-[#2d303a]/50">
                {/* Left Side - Navigation */}
                <div className="flex items-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-xl">
                        <Link
                            href="/research"
                            className={cn(
                                "flex items-center gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                                isResearch
                                    ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                        >
                            <Target className="h-3.5 w-3.5" />
                            <span>Research</span>
                        </Link>
                        <Link
                            href="/backtesting"
                            className={cn(
                                "flex items-center gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                                isBacktesting
                                    ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                        >
                            <FlaskConical className="h-3.5 w-3.5" />
                            <span>Backtesting</span>
                        </Link>
                        <Link
                            href="/fetch"
                            className={cn(
                                "flex items-center gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                                isFetch
                                    ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                        >
                            <FileSearch className="h-3.5 w-3.5" />
                            <span>Fetch</span>
                        </Link>
                        <Link
                            href="/simulate"
                            className={cn(
                                "flex items-center gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                                isSimulate
                                    ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                        >
                            <Activity className="h-3.5 w-3.5" />
                            <span>Simulate</span>
                        </Link>
                        <Link
                            href="/optimize"
                            className={cn(
                                "flex items-center gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                                isOptimize
                                    ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                        >
                            <PieChart className="h-3.5 w-3.5" />
                            <span>Optimize</span>
                        </Link>
                    </div>

                    {title && (
                        <>
                            <div className="h-6 w-px bg-[#2d303a]/60" />
                            <span className="text-base lg:text-lg font-semibold text-[#e8eaed]">
                                {title}
                            </span>
                        </>
                    )}
                </div>

                {/* Center - Custom Content */}
                {centerContent && (
                    <div className="flex-1 flex items-center justify-center">
                        {centerContent}
                    </div>
                )}

                {/* Right Side - Actions + Controls */}
                <div className="flex items-center gap-3">
                    {rightActions && (
                        <>
                            {rightActions}
                            <div className="w-px h-6 lg:h-7 bg-[#2d303a]/50" />
                        </>
                    )}

                    {/* Additional Controls */}
                    <div className="flex items-center gap-1">
                        <button className="p-2 lg:p-2.5 rounded-lg hover:bg-[#1a1d24] transition-colors text-[#8b8f9a] hover:text-[#e8eaed]">
                            <Grid3X3 className="h-4 w-4 lg:h-5 lg:w-5" />
                        </button>
                        <button className="p-2 lg:p-2.5 rounded-lg hover:bg-[#1a1d24] transition-colors text-[#8b8f9a] hover:text-[#e8eaed]">
                            <RotateCcw className="h-4 w-4 lg:h-5 lg:w-5" />
                        </button>
                        <button className="p-2 lg:p-2.5 rounded-lg hover:bg-[#1a1d24] transition-colors text-[#8b8f9a] hover:text-[#e8eaed]">
                            <Maximize2 className="h-4 w-4 lg:h-5 lg:w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
}

