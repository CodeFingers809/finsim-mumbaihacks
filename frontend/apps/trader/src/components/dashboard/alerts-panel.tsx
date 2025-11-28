"use client";

import {
    Bell,
    TrendingUp,
    Volume2,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import { useState } from "react";

interface Alert {
    id: string;
    type: "price" | "volume" | "technical" | "triggered";
    symbol: string;
    message: string;
    timestamp: string;
    isActive: boolean;
}

export function AlertsPanel() {
    const [filter, setFilter] = useState<"all" | "active" | "triggered">("all");

    // Mock alerts data
    const alerts: Alert[] = [
        {
            id: "1",
            type: "triggered",
            symbol: "GOOGL",
            message: "Price crossed $176 (Target)",
            timestamp: "2 min ago",
            isActive: false,
        },
        {
            id: "2",
            type: "volume",
            symbol: "AAPL",
            message: "Volume spike detected (2.5x avg)",
            timestamp: "15 min ago",
            isActive: true,
        },
        {
            id: "3",
            type: "technical",
            symbol: "MSFT",
            message: "RSI crossed 70 (Overbought)",
            timestamp: "32 min ago",
            isActive: true,
        },
        {
            id: "4",
            type: "price",
            symbol: "NVDA",
            message: "Approaching support at $140",
            timestamp: "1 hour ago",
            isActive: true,
        },
    ];

    const filteredAlerts = alerts.filter((alert) => {
        if (filter === "all") return true;
        if (filter === "active") return alert.isActive;
        if (filter === "triggered") return !alert.isActive;
        return true;
    });

    const getAlertIcon = (type: Alert["type"]) => {
        switch (type) {
            case "price":
                return <TrendingUp className="h-3.5 w-3.5" />;
            case "volume":
                return <Volume2 className="h-3.5 w-3.5" />;
            case "technical":
                return <AlertTriangle className="h-3.5 w-3.5" />;
            case "triggered":
                return <CheckCircle2 className="h-3.5 w-3.5" />;
        }
    };

    const getAlertColor = (type: Alert["type"], isActive: boolean) => {
        if (!isActive) return "text-gray-500";
        switch (type) {
            case "price":
                return "text-blue-400";
            case "volume":
                return "text-purple-400";
            case "technical":
                return "text-yellow-400";
            case "triggered":
                return "text-[#4ade80]";
        }
    };

    return (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-4">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-medium text-white">Alerts</h3>
                    <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                        {alerts.filter((a) => a.isActive).length}
                    </span>
                </div>
                <button className="text-[10px] text-blue-400 hover:text-blue-300">
                    Manage
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="mb-3 flex gap-1 rounded bg-black/40 p-1">
                <button
                    onClick={() => setFilter("all")}
                    className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                        filter === "all"
                            ? "bg-[#1a1a1a] text-white"
                            : "text-gray-500 hover:text-white"
                    }`}
                >
                    All ({alerts.length})
                </button>
                <button
                    onClick={() => setFilter("active")}
                    className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                        filter === "active"
                            ? "bg-[#1a1a1a] text-white"
                            : "text-gray-500 hover:text-white"
                    }`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter("triggered")}
                    className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                        filter === "triggered"
                            ? "bg-[#1a1a1a] text-white"
                            : "text-gray-500 hover:text-white"
                    }`}
                >
                    Triggered
                </button>
            </div>

            {/* Alerts List */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {filteredAlerts.length === 0 ? (
                    <div className="py-8 text-center">
                        <Bell className="mx-auto h-8 w-8 text-gray-700 mb-2" />
                        <p className="text-xs text-gray-500">
                            No alerts to display
                        </p>
                        <button className="mt-2 text-[10px] text-blue-400 hover:text-blue-300">
                            Create Alert
                        </button>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`rounded-lg border p-2.5 transition-colors hover:bg-[#1a1a1a] cursor-pointer ${
                                alert.isActive
                                    ? "border-[#2a2a2a] bg-black/30"
                                    : "border-[#1a1a1a] bg-black/20"
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <div
                                    className={`mt-0.5 ${getAlertColor(
                                        alert.type,
                                        alert.isActive
                                    )}`}
                                >
                                    {getAlertIcon(alert.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="mb-0.5 flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-white">
                                            {alert.symbol}
                                        </span>
                                        <span className="text-[9px] text-gray-500">
                                            {alert.timestamp}
                                        </span>
                                    </div>
                                    <p
                                        className={`text-[11px] ${
                                            alert.isActive
                                                ? "text-gray-300"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        {alert.message}
                                    </p>
                                </div>
                                {alert.isActive && (
                                    <button className="mt-0.5 rounded p-1 text-gray-500 hover:bg-black/40 hover:text-white">
                                        <svg
                                            className="h-3 w-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

