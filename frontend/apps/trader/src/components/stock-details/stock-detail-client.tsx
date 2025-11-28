"use client";

import { useState } from "react";
import type { CandlestickData, HistogramData } from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

import type { MarketQuote } from "@trader/types";

type CompanyProfile = {
    symbol: string;
    companyName: string;
    sector: string;
    industry: string;
    description?: string;
    website?: string;
    ceo?: string;
    employees?: number;
    marketCap?: number;
    country?: string;
};

type OptionRow = {
    strike: number;
    call: {
        oi: number;
        changeOi: number;
        volume: number;
        iv: number;
        ltp: number;
        change: number;
        bidQty: number;
        bidPrice: number;
        askQty: number;
        askPrice: number;
    };
    put: OptionRow["call"];
};

interface StockDetailClientProps {
    symbol: string;
    quote: MarketQuote;
    profile: CompanyProfile;
    candles: CandlestickData[];
    volumes: HistogramData[];
    optionChain: OptionRow[];
}

export function StockDetailClient({
    symbol,
    quote,
    profile,
    candles,
    volumes,
    optionChain,
}: StockDetailClientProps) {
    const [tab, setTab] = useState("company");

    return (
        <div className="space-y-6">
            <Card className="bg-surface/80">
                <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <CardTitle className="text-3xl font-semibold">
                                {profile.name}
                            </CardTitle>
                            <Badge variant="muted">{profile.sector}</Badge>
                        </div>
                        <p className="text-sm text-text-secondary">{symbol}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-semibold">
                            ₹{quote.lastPrice.toFixed(2)}
                        </p>
                        <p
                            className={`text-sm ${
                                quote.change >= 0
                                    ? "text-success"
                                    : "text-danger"
                            }`}
                        >
                            {quote.change.toFixed(2)} (
                            {quote.changePercent.toFixed(2)}%) today
                        </p>
                    </div>
                </CardHeader>
            </Card>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="company">Company Info</TabsTrigger>
                    <TabsTrigger value="chart">Chart View</TabsTrigger>
                    <TabsTrigger value="options">Option Chain</TabsTrigger>
                </TabsList>
                <TabsContent value="company" className="space-y-6">
                    <Card className="bg-surface/60">
                        <CardHeader>
                            <CardTitle>Key Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            {profile.metrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="rounded-xl border border-border bg-black/20 p-4"
                                >
                                    <p className="text-sm text-text-secondary">
                                        {metric.label}
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {metric.value}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card className="bg-surface/60">
                        <CardHeader>
                            <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed text-text-secondary">
                                {profile.description}
                            </p>
                            <div className="mt-6">
                                <p className="text-xs uppercase tracking-[0.4em] text-text-secondary">
                                    52W Range
                                </p>
                                <div className="mt-3 h-3 rounded-full bg-surface-muted">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{
                                            width: `${
                                                ((profile.range52.current -
                                                    profile.range52.low) /
                                                    (profile.range52.high -
                                                        profile.range52.low)) *
                                                100
                                            }%`,
                                        }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between text-xs text-text-secondary">
                                    <span>₹{profile.range52.low}</span>
                                    <span>₹{profile.range52.high}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chart">
                    <Card className="bg-surface/60">
                        <CardHeader>
                            <CardTitle>Price Action</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CandlestickChart data={candles} volume={volumes} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="options">
                    <Card className="bg-surface/60">
                        <CardHeader>
                            <CardTitle>Option Chain</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <THead>
                                    <TR>
                                        <TH colSpan={5}>CALLS</TH>
                                        <TH>STRIKE</TH>
                                        <TH colSpan={5}>PUTS</TH>
                                    </TR>
                                    <TR>
                                        {[
                                            "OI",
                                            "Chg OI",
                                            "IV",
                                            "LTP",
                                            "Bid/Ask",
                                            "Strike",
                                            "Bid/Ask",
                                            "LTP",
                                            "IV",
                                            "Chg OI",
                                            "OI",
                                        ].map((header) => (
                                            <TH key={header}>{header}</TH>
                                        ))}
                                    </TR>
                                </THead>
                                <TBody>
                                    {optionChain.map((row) => (
                                        <TR
                                            key={row.strike}
                                            className="text-xs"
                                        >
                                            <TD>{row.call.oi}</TD>
                                            <TD>{row.call.changeOi}%</TD>
                                            <TD>{row.call.iv}%</TD>
                                            <TD>{row.call.ltp}</TD>
                                            <TD>
                                                {row.call.bidQty}@
                                                {row.call.bidPrice}
                                                <br />
                                                {row.call.askQty}@
                                                {row.call.askPrice}
                                            </TD>
                                            <TD className="font-semibold">
                                                {row.strike}
                                            </TD>
                                            <TD>
                                                {row.put.bidQty}@
                                                {row.put.bidPrice}
                                                <br />
                                                {row.put.askQty}@
                                                {row.put.askPrice}
                                            </TD>
                                            <TD>{row.put.ltp}</TD>
                                            <TD>{row.put.iv}%</TD>
                                            <TD>{row.put.changeOi}%</TD>
                                            <TD>{row.put.oi}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

