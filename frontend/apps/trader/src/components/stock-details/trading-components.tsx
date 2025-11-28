"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Plus,
    Minus,
    RotateCcw,
    Maximize2,
    ChevronDown,
    Grid3X3,
    BarChart3,
    CandlestickChart,
    LineChart,
} from "lucide-react";
import Link from "next/link";

interface OrderPanelProps {
    symbol: string;
    currentPrice: number;
    bidPrice?: number;
    askPrice?: number;
    onBuy?: (qty: number, price: number) => void;
    onSell?: (qty: number, price: number) => void;
}

export function OrderPanel({
    symbol,
    currentPrice,
    bidPrice,
    askPrice,
    onBuy,
    onSell,
}: OrderPanelProps) {
    const [quantity, setQuantity] = useState(1);
    const [orderType, setOrderType] = useState<"market" | "limit">("market");
    const [limitPrice, setLimitPrice] = useState(currentPrice);

    const bid = bidPrice || currentPrice * 0.9995;
    const ask = askPrice || currentPrice * 1.0005;
    const spread = ask - bid;

    return (
        <div className="w-[280px] lg:w-[320px] xl:w-[340px] bg-[#12141a] border-l border-[#2d303a]/50 flex flex-col h-full overflow-hidden">
            {/* Order Type Header */}
            <div className="p-4 lg:p-5 border-b border-[#2d303a]/40">
                <div className="flex items-center gap-2 p-1 bg-[#1a1d24] rounded-xl">
                    <button
                        onClick={() => setOrderType("market")}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-200",
                            orderType === "market"
                                ? "bg-[#6c8cff] text-white shadow-md"
                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                        )}
                    >
                        Market
                    </button>
                    <button
                        onClick={() => setOrderType("limit")}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-200",
                            orderType === "limit"
                                ? "bg-[#6c8cff] text-white shadow-md"
                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                        )}
                    >
                        Limit
                    </button>
                </div>
            </div>

            {/* Price Display */}
            <div className="p-4 lg:p-5 space-y-3 border-b border-[#2d303a]/40">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b8f9a]">Bid</span>
                    <span className="text-sm lg:text-base font-mono font-semibold text-[#3dd68c]">
                        {bid.toFixed(2)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b8f9a]">Ask</span>
                    <span className="text-sm lg:text-base font-mono font-semibold text-[#f06c6c]">
                        {ask.toFixed(2)}
                    </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2d303a]/30">
                    <span className="text-xs text-[#5c606c]">Spread</span>
                    <span className="text-xs font-mono text-[#5c606c]">
                        {spread.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Quantity Input */}
            <div className="p-4 lg:p-5 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-2">
                    <label className="text-xs text-[#8b8f9a] font-medium">
                        Quantity
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                setQuantity(Math.max(1, quantity - 1))
                            }
                            className="p-2.5 lg:p-3 rounded-lg bg-[#1a1d24] hover:bg-[#252730] transition-colors border border-[#2d303a]/40"
                        >
                            <Minus className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-[#8b8f9a]" />
                        </button>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(
                                    Math.max(1, parseInt(e.target.value) || 1)
                                )
                            }
                            className="text-center font-mono text-base bg-[#1a1d24] border-[#2d303a]/40 focus:border-[#6c8cff]/50 rounded-lg h-11"
                        />
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-2.5 lg:p-3 rounded-lg bg-[#1a1d24] hover:bg-[#252730] transition-colors border border-[#2d303a]/40"
                        >
                            <Plus className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-[#8b8f9a]" />
                        </button>
                    </div>
                </div>

                {/* Limit Price Input (if limit order) */}
                {orderType === "limit" && (
                    <div className="space-y-2">
                        <label className="text-xs text-[#8b8f9a] font-medium">
                            Limit Price
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={limitPrice}
                            onChange={(e) =>
                                setLimitPrice(
                                    parseFloat(e.target.value) || currentPrice
                                )
                            }
                            className="font-mono text-base bg-[#1a1d24] border-[#2d303a]/40 focus:border-[#6c8cff]/50 rounded-lg h-11"
                        />
                    </div>
                )}

                {/* Quick Quantity Buttons */}
                <div className="grid grid-cols-4 gap-2">
                    {[1, 10, 50, 100].map((qty) => (
                        <button
                            key={qty}
                            onClick={() => setQuantity(qty)}
                            className={cn(
                                "py-2 text-xs rounded-lg border transition-all duration-200",
                                quantity === qty
                                    ? "bg-[#6c8cff]/15 border-[#6c8cff]/40 text-[#6c8cff] font-semibold"
                                    : "border-[#2d303a]/40 text-[#8b8f9a] hover:bg-[#1a1d24] hover:border-[#3d404a]"
                            )}
                        >
                            {qty}
                        </button>
                    ))}
                </div>

                {/* Order Value */}
                <div className="p-3 lg:p-4 rounded-xl bg-[#1a1d24] border border-[#2d303a]/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8b8f9a]">
                            Order Value
                        </span>
                        <span className="text-sm lg:text-base font-bold font-mono text-[#e8eaed]">
                            ₹
                            {(
                                quantity *
                                (orderType === "limit"
                                    ? limitPrice
                                    : currentPrice)
                            ).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Buy/Sell Buttons */}
            <div className="p-4 lg:p-5 space-y-3 border-t border-[#2d303a]/40 bg-[#0c0d10]/50">
                <button
                    onClick={() =>
                        onBuy?.(
                            quantity,
                            orderType === "limit" ? limitPrice : currentPrice
                        )
                    }
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#3dd68c] to-[#2fc77c] hover:from-[#4ae39a] hover:to-[#3dd68c] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[#3dd68c]/20"
                >
                    <span>BUY</span>
                    <span className="font-mono opacity-90">
                        {bid.toFixed(2)}
                    </span>
                </button>
                <button
                    onClick={() =>
                        onSell?.(
                            quantity,
                            orderType === "limit" ? limitPrice : currentPrice
                        )
                    }
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f06c6c] to-[#e85555] hover:from-[#f58080] hover:to-[#f06c6c] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[#f06c6c]/20"
                >
                    <span>SELL</span>
                    <span className="font-mono opacity-90">
                        {ask.toFixed(2)}
                    </span>
                </button>
            </div>
        </div>
    );
}

interface ChartToolbarProps {
    symbol: string;
    timeframe: string;
    onTimeframeChange: (tf: string) => void;
    chartType: string;
    onChartTypeChange: (type: string) => void;
}

export function ChartToolbar({
    symbol,
    timeframe,
    onTimeframeChange,
    chartType,
    onChartTypeChange,
}: ChartToolbarProps) {
    const timeframes = ["1m", "5m", "15m", "1h", "4h", "1D", "1W", "1M"];
    const chartTypes = [
        { id: "candle", icon: CandlestickChart, label: "Candlestick" },
        { id: "line", icon: LineChart, label: "Line" },
        { id: "bar", icon: BarChart3, label: "Bar" },
    ];

    return (
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 bg-[#12141a] border-b border-[#2d303a]/50">
            {/* Left Side - Symbol & Navigation */}
            <div className="flex items-center gap-4 lg:gap-6">
                <Link
                    href="/research"
                    className="p-2 lg:p-2.5 rounded-lg hover:bg-[#1a1d24] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 text-[#8b8f9a] hover:text-[#e8eaed]" />
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-base lg:text-lg font-semibold text-[#e8eaed]">
                        {symbol}
                    </span>
                    <Badge
                        variant="outline"
                        className="text-[10px] lg:text-xs bg-[#1a1d24] border-[#2d303a]/50 text-[#8b8f9a]"
                    >
                        NSE
                    </Badge>
                </div>
            </div>

            {/* Center - Timeframes */}
            <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-xl">
                {timeframes.map((tf) => (
                    <button
                        key={tf}
                        onClick={() => onTimeframeChange(tf)}
                        className={cn(
                            "px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs rounded-lg transition-all duration-200",
                            timeframe === tf
                                ? "bg-[#6c8cff] text-white font-medium shadow-md"
                                : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                        )}
                    >
                        {tf}
                    </button>
                ))}
            </div>

            {/* Right Side - Chart Controls */}
            <div className="flex items-center gap-3">
                {/* Chart Type */}
                <div className="flex items-center gap-1 p-1 bg-[#1a1d24] rounded-xl">
                    {chartTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => onChartTypeChange(type.id)}
                            className={cn(
                                "p-2 lg:p-2.5 rounded-lg transition-all duration-200",
                                chartType === type.id
                                    ? "bg-[#6c8cff]/20 text-[#6c8cff]"
                                    : "text-[#8b8f9a] hover:text-[#e8eaed] hover:bg-[#252730]"
                            )}
                            title={type.label}
                        >
                            <type.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-px h-6 lg:h-7 bg-[#2d303a]/50" />

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
    );
}

interface MarketDepthProps {
    symbol: string;
    bidLevels?: { price: number; qty: number; orders: number }[];
    askLevels?: { price: number; qty: number; orders: number }[];
}

export function MarketDepth({
    symbol,
    bidLevels,
    askLevels,
}: MarketDepthProps) {
    // Mock depth data if not provided
    const defaultBids = bidLevels || [
        { price: 416.1, qty: 105, orders: 4 },
        { price: 416.0, qty: 0, orders: 0 },
        { price: 415.95, qty: 0, orders: 0 },
        { price: 415.9, qty: 0, orders: 0 },
        { price: 415.85, qty: 0, orders: 0 },
    ];

    const defaultAsks = askLevels || [
        { price: 416.15, qty: 0, orders: 0 },
        { price: 416.2, qty: 0, orders: 0 },
        { price: 416.25, qty: 0, orders: 0 },
        { price: 416.3, qty: 0, orders: 0 },
        { price: 416.35, qty: 0, orders: 0 },
    ];

    const totalBidQty = defaultBids.reduce((sum, b) => sum + b.qty, 0);
    const totalAskQty = defaultAsks.reduce((sum, a) => sum + a.qty, 0);

    return (
        <div className="w-[200px] bg-surface/90 border-l border-border/40 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-2 border-b border-border/40">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Market Depth
                </h3>
            </div>

            {/* Depth Table */}
            <div className="flex-1 overflow-auto">
                {/* Header Row */}
                <div className="grid grid-cols-4 gap-1 px-2 py-1 text-[10px] text-text-secondary border-b border-border/40 sticky top-0 bg-surface/90">
                    <span>Bid</span>
                    <span className="text-center">Orders</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Offer</span>
                </div>

                {/* Depth Rows */}
                {defaultBids.map((bid, idx) => (
                    <div
                        key={idx}
                        className="grid grid-cols-4 gap-1 px-2 py-1.5 text-[11px] font-mono border-b border-border/20"
                    >
                        <span className="text-success">
                            {bid.price.toFixed(2)}
                        </span>
                        <span className="text-center text-text-secondary">
                            {bid.orders}
                        </span>
                        <span className="text-center">{bid.qty}</span>
                        <span className="text-right text-danger">
                            {defaultAsks[idx]?.price.toFixed(2) || "-"}
                        </span>
                    </div>
                ))}

                {/* Totals */}
                <div className="grid grid-cols-4 gap-1 px-2 py-2 text-[11px] font-semibold border-t border-border/40 bg-black/20">
                    <span className="text-success">Total</span>
                    <span className="text-center text-text-secondary">-</span>
                    <span className="text-center text-success">
                        {totalBidQty}
                    </span>
                    <span className="text-right text-danger">
                        {totalAskQty}
                    </span>
                </div>
            </div>

            {/* Additional Info */}
            <div className="p-2 border-t border-border/40 space-y-1 text-[10px]">
                <div className="flex justify-between">
                    <span className="text-text-secondary">LTT</span>
                    <span className="font-mono">-</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Avg Price</span>
                    <span className="font-mono">-</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Volume</span>
                    <span className="font-mono">-</span>
                </div>
            </div>
        </div>
    );
}

interface WatchlistSidebarProps {
    stocks: {
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
    }[];
    activeSymbol?: string;
    onSelectStock: (symbol: string) => void;
}

export function WatchlistSidebar({
    stocks,
    activeSymbol,
    onSelectStock,
}: WatchlistSidebarProps) {
    return (
        <div className="w-[260px] lg:w-[280px] xl:w-[300px] bg-[#12141a] border-r border-[#2d303a]/50 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 lg:p-5 border-b border-[#2d303a]/40 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#8b8f9a] uppercase tracking-wider">
                    Watchlist
                </h3>
                <button className="text-xs text-[#6c8cff] hover:text-[#8aa4ff] font-medium transition-colors">
                    + Add
                </button>
            </div>

            {/* Stock List */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                {stocks.map((stock, index) => (
                    <button
                        key={stock.symbol}
                        onClick={() => onSelectStock(stock.symbol)}
                        className={cn(
                            "w-full px-4 lg:px-5 py-3.5 lg:py-4 text-left transition-all duration-200 group",
                            activeSymbol === stock.symbol
                                ? "bg-[#6c8cff]/10 border-l-2 border-l-[#6c8cff]"
                                : "hover:bg-[#1a1d24] border-l-2 border-l-transparent",
                            index !== stocks.length - 1 &&
                                "border-b border-[#2d303a]/30"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm lg:text-base font-semibold text-[#e8eaed] group-hover:text-white">
                                {stock.symbol}
                            </span>
                            <span
                                className={cn(
                                    "text-xs font-mono font-semibold px-2 py-1 rounded",
                                    stock.change >= 0
                                        ? "text-[#3dd68c] bg-[#3dd68c]/10"
                                        : "text-[#f06c6c] bg-[#f06c6c]/10"
                                )}
                            >
                                {stock.change >= 0 ? "+" : ""}
                                {stock.changePercent.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[11px] lg:text-xs text-[#5c606c] truncate max-w-[120px] lg:max-w-[140px]">
                                {stock.name}
                            </span>
                            <span className="text-xs lg:text-sm font-mono text-[#8b8f9a]">
                                ₹{stock.price.toFixed(2)}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

