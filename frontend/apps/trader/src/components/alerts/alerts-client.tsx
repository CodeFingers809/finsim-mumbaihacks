"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    Check,
    CheckCircle2,
    Filter,
    Loader2,
    Phone,
    Plus,
    Save,
    Settings,
    Tag,
    UserX,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerminalLayout } from "@/components/layout/terminal-layout";
import { cn } from "@/lib/utils/cn";

// BSE Categories from the data
const BSE_CATEGORIES = [
    {
        id: "insider-trading",
        label: "Insider Trading / SAST",
        color: "text-red-400 border-red-500/30 bg-red-500/10",
    },
    {
        id: "board-meeting",
        label: "Board Meeting",
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    },
    {
        id: "agm-egm",
        label: "AGM/EGM",
        color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    },
    {
        id: "company-update",
        label: "Company Update",
        color: "text-green-400 border-green-500/30 bg-green-500/10",
    },
    {
        id: "corp-action",
        label: "Corp Action",
        color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    },
    {
        id: "financial-results",
        label: "Financial Results",
        color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    },
    {
        id: "dividend",
        label: "Dividend",
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
    {
        id: "acquisition",
        label: "Acquisition/Merger",
        color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    },
    {
        id: "bonus-split",
        label: "Bonus/Stock Split",
        color: "text-pink-400 border-pink-500/30 bg-pink-500/10",
    },
    {
        id: "rights-issue",
        label: "Rights Issue",
        color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    },
];

interface Filters {
    scrips: string[];
    categories: string[];
    keywords: string[];
}

interface UserFiltersResponse {
    user: {
        phoneNumber?: string | null;
        filters: Filters;
    };
}

// Tag Input Component
function TagInput({
    value,
    onChange,
    placeholder,
    className,
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    className?: string;
}) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                const trimmed = inputValue.trim();
                if (trimmed && !value.includes(trimmed)) {
                    onChange([...value, trimmed]);
                }
                setInputValue("");
            } else if (
                e.key === "Backspace" &&
                !inputValue &&
                value.length > 0
            ) {
                onChange(value.slice(0, -1));
            }
        },
        [inputValue, value, onChange]
    );

    const removeTag = useCallback(
        (tagToRemove: string) => {
            onChange(value.filter((tag) => tag !== tagToRemove));
        },
        [value, onChange]
    );

    return (
        <div
            className={cn(
                "flex flex-wrap gap-2 p-3 rounded-lg border border-[#2d303a]/60 bg-[#12141a] min-h-[48px] focus-within:border-[#6c8cff]/50 transition-colors",
                className
            )}
        >
            {value.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#6c8cff]/15 text-[#6c8cff] text-sm font-medium border border-[#6c8cff]/30"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-[#6c8cff]/20 rounded p-0.5 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-[#e8eaed] placeholder:text-[#8b8f9a]/60"
            />
        </div>
    );
}

// Category Checkbox Component
function CategoryCheckbox({
    category,
    checked,
    onChange,
}: {
    category: (typeof BSE_CATEGORIES)[0];
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200",
                checked
                    ? category.color
                    : "border-[#2d303a]/60 bg-[#12141a] text-[#8b8f9a] hover:border-[#2d303a] hover:text-[#e8eaed]"
            )}
        >
            <div
                className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
                    checked
                        ? "border-current bg-current/20"
                        : "border-[#3d404a]"
                )}
            >
                {checked && <Check className="h-2.5 w-2.5" />}
            </div>
            <span className="text-xs font-medium">{category.label}</span>
        </button>
    );
}

async function fetchUserFilters(): Promise<UserFiltersResponse> {
    const response = await fetch("/api/user/filters", { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Unable to load user filters");
    }
    return response.json();
}

async function saveUserFilters(payload: {
    phoneNumber: string;
    scrips: string[];
    categories: string[];
    keywords: string[];
}): Promise<UserFiltersResponse> {
    const response = await fetch("/api/user/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body?.error ?? "Unable to save filters";
        throw new Error(
            typeof message === "string" ? message : "Unable to save filters"
        );
    }

    return response.json();
}

async function unsubscribeAlerts(): Promise<UserFiltersResponse> {
    const response = await fetch("/api/user/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phoneNumber: "",
            scrips: [],
            categories: [],
            keywords: [],
        }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body?.error ?? "Unable to unsubscribe";
        throw new Error(
            typeof message === "string" ? message : "Unable to unsubscribe"
        );
    }

    return response.json();
}

export function AlertsClient() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["user-filters"],
        queryFn: fetchUserFilters,
    });

    const [phoneNumber, setPhoneNumber] = useState("");
    const [scrips, setScrips] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);

    useEffect(() => {
        if (!data?.user) return;
        setPhoneNumber(data.user.phoneNumber ?? "");
        setScrips(data.user.filters?.scrips ?? []);
        setCategories(data.user.filters?.categories ?? []);
        setKeywords(data.user.filters?.keywords ?? []);
    }, [data]);

    const { mutate, isPending } = useMutation({
        mutationFn: saveUserFilters,
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["user-filters"] });
            toast.success("Alert filters saved successfully");
            setPhoneNumber(response.user.phoneNumber ?? "");
            setScrips(response.user.filters?.scrips ?? []);
            setCategories(response.user.filters?.categories ?? []);
            setKeywords(response.user.filters?.keywords ?? []);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to save filters");
        },
    });

    const { mutate: unsubscribe, isPending: isUnsubscribing } = useMutation({
        mutationFn: unsubscribeAlerts,
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["user-filters"] });
            toast.success("Successfully unsubscribed from alerts");
            setPhoneNumber("");
            setScrips([]);
            setCategories([]);
            setKeywords([]);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to unsubscribe");
        },
    });

    const toggleCategory = useCallback((categoryLabel: string) => {
        setCategories((prev) =>
            prev.includes(categoryLabel)
                ? prev.filter((c) => c !== categoryLabel)
                : [...prev, categoryLabel]
        );
    }, []);

    const handleSave = useCallback(() => {
        mutate({
            phoneNumber: phoneNumber.trim(),
            scrips,
            categories,
            keywords,
        });
    }, [mutate, phoneNumber, scrips, categories, keywords]);

    const hasChanges = useMemo(() => {
        if (!data?.user) return false;
        const original = data.user;
        return (
            phoneNumber !== (original.phoneNumber ?? "") ||
            JSON.stringify(scrips) !==
                JSON.stringify(original.filters?.scrips ?? []) ||
            JSON.stringify(categories) !==
                JSON.stringify(original.filters?.categories ?? []) ||
            JSON.stringify(keywords) !==
                JSON.stringify(original.filters?.keywords ?? [])
        );
    }, [data, phoneNumber, scrips, categories, keywords]);

    return (
        <TerminalLayout
            title={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
                    <Bell className="h-4 w-4 text-[#6c8cff]" />
                    <span className="text-sm font-medium text-[#e8eaed]">
                        Alert Configuration
                    </span>
                    {categories.length > 0 && (
                        <Badge
                            variant="outline"
                            className="text-[10px] bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                        >
                            {categories.length} categories
                        </Badge>
                    )}
                </div>
            }
            rightActions={
                <div className="flex items-center gap-2">
                    {(phoneNumber ||
                        categories.length > 0 ||
                        scrips.length > 0 ||
                        keywords.length > 0) && (
                        <Button
                            onClick={() => unsubscribe()}
                            disabled={isUnsubscribing}
                            variant="outline"
                            className="gap-2 px-4 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                        >
                            {isUnsubscribing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <UserX className="h-4 w-4" />
                            )}
                            Unsubscribe
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !hasChanges}
                        className={cn(
                            "gap-2 px-4",
                            hasChanges
                                ? "bg-[#6c8cff] hover:bg-[#5a7ae0] text-white"
                                : "bg-[#1a1d24] text-[#8b8f9a]"
                        )}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            }
        >
            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden h-full">
                {/* Left Panel - Settings */}
                <div className="w-[400px] border-r border-[#2d303a]/50 bg-[#12141a] flex flex-col shrink-0 h-full">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[#2d303a]/40">
                        <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-[#6c8cff]" />
                            <span className="text-sm font-medium text-[#e8eaed]">
                                WhatsApp Settings
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a] uppercase tracking-wide">
                                <Phone className="h-3.5 w-3.5" />
                                WhatsApp Number
                            </label>
                            <Input
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+919876543210"
                                className="bg-[#0c0d10] border-[#2d303a]/60 text-[#e8eaed] placeholder:text-[#8b8f9a]/50"
                            />
                            <p className="text-[10px] text-[#8b8f9a]/60">
                                Include country code (E.164 format)
                            </p>
                        </div>

                        {/* Keywords */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a] uppercase tracking-wide">
                                <Tag className="h-3.5 w-3.5" />
                                Keywords
                            </label>
                            <TagInput
                                value={keywords}
                                onChange={setKeywords}
                                placeholder="Type keyword and press Enter..."
                            />
                            <p className="text-[10px] text-[#8b8f9a]/60">
                                Match announcements containing these words
                            </p>
                        </div>

                        {/* Scrip Codes */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-[#8b8f9a] uppercase tracking-wide">
                                <Filter className="h-3.5 w-3.5" />
                                Scrip Codes
                            </label>
                            <TagInput
                                value={scrips}
                                onChange={setScrips}
                                placeholder="Add scrip code (e.g., 500325)..."
                            />
                            <p className="text-[10px] text-[#8b8f9a]/60">
                                Leave empty to receive alerts for all stocks
                            </p>
                        </div>

                        {/* Status */}
                        <div className="mt-6 p-4 rounded-lg bg-[#0c0d10] border border-[#2d303a]/40">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="h-4 w-4 text-[#3dd68c]" />
                                <span className="text-xs font-medium text-[#e8eaed]">
                                    Pipeline Status
                                </span>
                            </div>
                            <div className="space-y-2 text-[11px] text-[#8b8f9a]">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#3dd68c]" />
                                    Clerk session active
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#3dd68c]" />
                                    MongoDB connected
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#3dd68c]" />
                                    WhatsApp server ready
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center - Categories */}
                <div className="flex-1 flex flex-col bg-[#0c0d10] h-full overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#2d303a]/40 bg-[#12141a]/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-[#e8eaed]">
                                    Announcement Categories
                                </h2>
                                <p className="text-xs text-[#8b8f9a] mt-0.5">
                                    Select the types of BSE announcements you
                                    want to receive
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCategories(
                                            BSE_CATEGORIES.map((c) => c.label)
                                        )
                                    }
                                    className="text-xs text-[#6c8cff] hover:text-[#8ba6ff] transition-colors"
                                >
                                    Select All
                                </button>
                                <span className="text-[#2d303a]">|</span>
                                <button
                                    onClick={() => setCategories([])}
                                    className="text-xs text-[#8b8f9a] hover:text-[#e8eaed] transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-[#6c8cff]" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                                {BSE_CATEGORIES.map((category) => (
                                    <CategoryCheckbox
                                        key={category.id}
                                        category={category}
                                        checked={categories.includes(
                                            category.label
                                        )}
                                        onChange={() =>
                                            toggleCategory(category.label)
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {/* Selected Summary */}
                        {categories.length > 0 && (
                            <div className="mt-6 p-4 rounded-lg bg-[#12141a] border border-[#2d303a]/40">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bell className="h-4 w-4 text-[#6c8cff]" />
                                    <span className="text-xs font-medium text-[#e8eaed]">
                                        Selected Categories ({categories.length}
                                        )
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => {
                                        const category = BSE_CATEGORIES.find(
                                            (c) => c.label === cat
                                        );
                                        return (
                                            <span
                                                key={cat}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                                                    category?.color ??
                                                        "text-[#8b8f9a] border-[#2d303a]/60 bg-[#0c0d10]"
                                                )}
                                            >
                                                {cat}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleCategory(cat)
                                                    }
                                                    className="hover:opacity-70 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="w-[320px] border-l border-[#2d303a]/50 bg-[#12141a] flex flex-col shrink-0 h-full">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[#2d303a]/40">
                        <span className="text-sm font-medium text-[#e8eaed]">
                            Configuration Preview
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <pre className="rounded-lg bg-[#0c0d10] p-4 text-[11px] text-[#8b8f9a] border border-[#2d303a]/40 overflow-x-auto font-mono">
                            {JSON.stringify(
                                {
                                    phoneNumber: phoneNumber.trim() || null,
                                    filters: {
                                        scrips,
                                        categories,
                                        keywords,
                                    },
                                },
                                null,
                                2
                            )}
                        </pre>

                        {/* Quick Stats */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0c0d10] border border-[#2d303a]/40">
                                <span className="text-xs text-[#8b8f9a]">
                                    Scrips
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] border-[#2d303a]/50"
                                >
                                    {scrips.length === 0
                                        ? "All"
                                        : scrips.length}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0c0d10] border border-[#2d303a]/40">
                                <span className="text-xs text-[#8b8f9a]">
                                    Categories
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] border-[#2d303a]/50"
                                >
                                    {categories.length}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0c0d10] border border-[#2d303a]/40">
                                <span className="text-xs text-[#8b8f9a]">
                                    Keywords
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] border-[#2d303a]/50"
                                >
                                    {keywords.length}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TerminalLayout>
    );
}

