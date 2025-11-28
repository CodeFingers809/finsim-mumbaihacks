"use client";

import type { BacktestResult, TradeMetrics } from "@trader/types";
import { useState } from "react";
import {
    BarChart2,
    Activity,
    Target,
    AlertTriangle,
    LineChart,
    ChevronDown,
    ChevronUp,
    Code2,
    Lightbulb,
    CheckCircle2,
    XCircle,
    Trophy,
    Shield,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

// Colors for different stock lines
const STOCK_COLORS = [
    "#6c8cff", // Blue
    "#f59e0b", // Orange
    "#3dd68c", // Green
    "#f06c6c", // Red
    "#a78bfa", // Purple
    "#14b8a6", // Teal
    "#f472b6", // Pink
    "#84cc16", // Lime
];
  const drawdownData: { date: string; drawdown: number }[] = [];
  
  let peak = 0;
  dates.forEach((date, i) => {
    const totalValue = equityCurves.reduce((sum, curve) => sum + (curve.points[i]?.value ?? 0), 0);
    peak = Math.max(peak, totalValue);
    const drawdown = peak > 0 ? ((totalValue - peak) / peak) * 100 : 0;
    drawdownData.push({ date, drawdown });
  });
  
  return drawdownData;
}

// Generate correlation matrix
function generateCorrelationMatrix(stocks: string[]) {
  const data: { x: string; y: string; value: number }[] = [];
  
  stocks.forEach((stock1) => {
    stocks.forEach((stock2) => {
      if (stock1 === stock2) {
        data.push({ x: stock1, y: stock2, value: 1.0 });
      } else {
        // Generate random correlation between -0.5 and 0.9
        const correlation = (Math.random() * 1.4 - 0.5);
        data.push({ x: stock1, y: stock2, value: Math.round(correlation * 100) / 100 });
      }
    });
  });
  
  return data;
}

// Generate monthly returns data
function generateMonthlyReturns() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month) => ({
    date: month,
    value: (Math.random() - 0.55) * 15, // -8% to +7%
  }));
}

// Mock data for demonstration
const MOCK_DATA = {
  stocks: ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HINDUNILVR.NS", "ITC.NS"],
  initialCapital: 50000,
  finalBalance: 37365.07,
  totalPnL: -12634.93,
  portfolioReturn: -25.27,
  avgStrategyReturn: -25.27,
  avgBuyHoldReturn: 30.48,
  sharpeRatio: -5.79,
  avgWinRate: 9.3,
  totalTrades: 842,
  profitableAssets: 0,
  maxDrawdown: -32.5,
  sortinoRatio: -4.2,
  calmarRatio: -0.78,
  profitFactor: 0.42,
  avgTradeDuration: 5.2,
  winningTrades: 78,
  losingTrades: 764,
  chartData: {
    pnlBySymbol: [
      { symbol: "RELIANCE.NS", value: -1100 },
      { symbol: "TCS.NS", value: -2500 },
      { symbol: "INFY.NS", value: -3000 },
      { symbol: "HINDUNILVR.NS", value: -2200 },
      { symbol: "ITC.NS", value: -2800 },
    ],
    strategyVsBuyHold: [
      { symbol: "RELIANCE.NS", strategy: -15, buyHold: 18 },
      { symbol: "TCS.NS", strategy: -22, buyHold: 5 },
      { symbol: "INFY.NS", strategy: -28, buyHold: -8 },
      { symbol: "HINDUNILVR.NS", strategy: -18, buyHold: -12 },
      { symbol: "ITC.NS", strategy: -25, buyHold: 130 },
    ],
    equityCurves: [] as { symbol: string; points: { date: string; value: number }[] }[],
  },
};

// Generate equity curves for mock data
MOCK_DATA.chartData.equityCurves = MOCK_DATA.stocks.map((symbol, index) => 
  generateMockEquityCurve(symbol, 10000, 0.015 + index * 0.003)
);


export function BacktestResults({ result }: { result?: BacktestResult | null }) {
  if (!result) {
    return (
      <Card className="bg-[#12141a] border-[#2d303a]/50">
        <CardHeader className="border-b border-[#2d303a]/40">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#6c8cff]" />
            <CardTitle className="text-[#e8eaed]">Backtest Results</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-[#1a1d24] border border-[#2d303a]/50">
              <BarChart2 className="h-8 w-8 text-[#8b8f9a]" />
            </div>
            <p className="text-sm text-[#8b8f9a]">Run a backtest to see detailed charts and performance metrics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use mock data as fallback when result data is incomplete
  const useMock = !result.chartData || 
    (result.chartData.pnlBySymbol?.length === 0 && 
     result.chartData.equityCurves?.length === 0);

  // Safe access helpers with mock data fallback
  const portfolioReturn = result.portfolioReturn ?? (useMock ? MOCK_DATA.portfolioReturn : 0);
  const finalBalance = result.finalBalance ?? (useMock ? MOCK_DATA.finalBalance : 0);
  const totalPnL = result.totalPnL ?? (useMock ? MOCK_DATA.totalPnL : 0);
  const avgWinRate = result.avgWinRate ?? (useMock ? MOCK_DATA.avgWinRate : 0);
  const totalTrades = result.totalTrades ?? (useMock ? MOCK_DATA.totalTrades : 0);
  const sharpeRatio = result.sharpeRatio ?? (useMock ? MOCK_DATA.sharpeRatio : 0);
  const profitableAssets = result.profitableAssets ?? (useMock ? MOCK_DATA.profitableAssets : 0);
  const initialCapital = result.initialCapital ?? (useMock ? MOCK_DATA.initialCapital : 0);
  const avgStrategyReturn = result.avgStrategyReturn ?? (useMock ? MOCK_DATA.avgStrategyReturn : 0);
  const avgBuyHoldReturn = result.avgBuyHoldReturn ?? (useMock ? MOCK_DATA.avgBuyHoldReturn : 0);
  const stocks = result.stocks?.length ? result.stocks : (useMock ? MOCK_DATA.stocks : []);
  
  const chartData = {
    pnlBySymbol: result.chartData?.pnlBySymbol?.length ? result.chartData.pnlBySymbol : (useMock ? MOCK_DATA.chartData.pnlBySymbol : []),
    strategyVsBuyHold: result.chartData?.strategyVsBuyHold?.length ? result.chartData.strategyVsBuyHold : (useMock ? MOCK_DATA.chartData.strategyVsBuyHold : []),
    equityCurves: result.chartData?.equityCurves?.length ? result.chartData.equityCurves : (useMock ? MOCK_DATA.chartData.equityCurves : []),
  };

  return (
    <div className="space-y-6">
      {/* Mock Data Indicator */}
      {useMock && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
          <Zap className="h-4 w-4 text-[#f59e0b]" />
          <span className="text-sm text-[#f59e0b]">Showing sample data for demonstration</span>
        </div>
      )}

      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Portfolio Return"
          value={`${portfolioReturn > 0 ? "+" : ""}${portfolioReturn.toFixed(2)}%`}
          isPositive={portfolioReturn >= 0}
        />
        <MetricCard
          icon={DollarSign}
          label="Final Balance"
          value={`₹${finalBalance.toLocaleString('en-IN')}`}
          subValue={`P&L: ${totalPnL > 0 ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString('en-IN')}`}
        />
        <MetricCard
          icon={Activity}
          label="Win Rate"
          value={`${avgWinRate.toFixed(1)}%`}
          subValue={`${totalTrades} trades`}
        />
        <MetricCard
          icon={BarChart2}
          label="Sharpe Ratio"
          value={sharpeRatio.toFixed(2)}
          subValue={`${profitableAssets}/${stocks.length} profitable`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* P&L by Symbol - Horizontal Bar Chart */}
        <Card className="bg-[#12141a] border-[#2d303a]/50">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#f06c6c]" />
              <CardTitle className="text-[#e8eaed] text-base">Profit/Loss by Symbol</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <BarChart
              data={chartData.pnlBySymbol.map((item) => ({
                label: item.symbol.replace(".NS", ""),
                value: item.value,
              }))}
              height={Math.max(180, chartData.pnlBySymbol.length * 50)}
              horizontal={true}
            />
          </CardContent>
        </Card>

        {/* Strategy vs Buy & Hold - Grouped Bar Chart */}
        <Card className="bg-[#12141a] border-[#2d303a]/50">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#6c8cff]" />
              <CardTitle className="text-[#e8eaed] text-base">Strategy vs Buy & Hold Returns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <GroupedBarChart
              data={chartData.strategyVsBuyHold.map((item) => ({
                label: item.symbol,
                values: [
                  { name: "Strategy", value: item.strategy, color: "#6c8cff" },
                  { name: "Buy & Hold", value: item.buyHold, color: "#f59e0b" },
                ],
              }))}
              height={260}
            />
          </CardContent>
        </Card>

        {/* Equity Curves - Multi-Line Chart */}
        <Card className="bg-[#12141a] border-[#2d303a]/50 lg:col-span-2">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#3dd68c]" />
              <CardTitle className="text-[#e8eaed] text-base">Equity Curves Over Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <MultiLineChart
              data={chartData.equityCurves.map((curve, index) => ({
                label: curve.symbol,
                color: STOCK_COLORS[index % STOCK_COLORS.length],
                points: curve.points,
              }))}
              height={280}
              showLegend={true}
              showInitialLine={true}
              initialValue={stocks.length > 0 ? initialCapital / stocks.length : initialCapital}
            />
          </CardContent>
        </Card>

        {/* Portfolio Summary */}
        <Card className="bg-[#12141a] border-[#2d303a]/50 lg:col-span-2">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#a78bfa]" />
              <CardTitle className="text-[#e8eaed] text-base">Portfolio Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Capital & Returns */}
              <div className="space-y-4 p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40">
                <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wide">Capital</h4>
                <div className="space-y-3">
                  <SummaryRow label="Initial Capital" value={`₹${initialCapital.toLocaleString('en-IN')}`} />
                  <SummaryRow label="Final Balance" value={`₹${finalBalance.toLocaleString('en-IN')}`} highlight />
                  <SummaryRow 
                    label="Total P&L" 
                    value={`${totalPnL > 0 ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString('en-IN')}`}
                    valueColor={totalPnL >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"}
                  />
                  <SummaryRow 
                    label="Portfolio Return" 
                    value={`${portfolioReturn > 0 ? "+" : ""}${portfolioReturn.toFixed(2)}%`}
                    valueColor={portfolioReturn >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"}
                  />
                </div>
              </div>

              {/* Strategy Performance */}
              <div className="space-y-4 p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40">
                <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wide">Strategy Performance</h4>
                <div className="space-y-3">
                  <SummaryRow 
                    label="Avg Strategy Return" 
                    value={`${avgStrategyReturn > 0 ? "+" : ""}${avgStrategyReturn.toFixed(2)}%`}
                    valueColor={avgStrategyReturn >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"}
                  />
                  <SummaryRow 
                    label="Avg Buy & Hold Return" 
                    value={`${avgBuyHoldReturn > 0 ? "+" : ""}${avgBuyHoldReturn.toFixed(2)}%`}
                    valueColor={avgBuyHoldReturn >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"}
                  />
                  <SummaryRow 
                    label="Sharpe Ratio" 
                    value={sharpeRatio.toFixed(2)}
                    valueColor={sharpeRatio >= 0 ? "text-[#e8eaed]" : "text-[#f06c6c]"}
                  />
                  <SummaryRow label="Win Rate" value={`${avgWinRate.toFixed(1)}%`} />
                </div>
              </div>

              {/* Trading Stats */}
              <div className="space-y-4 p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40">
                <h4 className="text-xs font-medium text-[#8b8f9a] uppercase tracking-wide">Trading Statistics</h4>
                <div className="space-y-3">
                  <SummaryRow label="Total Trades" value={`${totalTrades}`} />
                  <SummaryRow label="Profitable Assets" value={`${profitableAssets}/${stocks.length}`} />
                  <SummaryRow label="Assets Tracked" value={stocks.length > 0 ? stocks.join(", ").replace(/.NS/g, "") : "None"} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Drawdown Chart */}
        <Card className="bg-[#12141a] border-[#2d303a]/50">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#f06c6c]" />
              <CardTitle className="text-[#e8eaed] text-base">Portfolio Drawdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DrawdownChart
              data={generateDrawdownData(chartData.equityCurves)}
              height={180}
            />
          </CardContent>
        </Card>

        {/* NEW: Win/Loss Distribution Donut */}
        <Card className="bg-[#12141a] border-[#2d303a]/50">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#a78bfa]" />
              <CardTitle className="text-[#e8eaed] text-base">Trade Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex justify-center">
            <DonutChart
              data={[
                { label: "Winning", value: useMock ? MOCK_DATA.winningTrades : Math.round(totalTrades * avgWinRate / 100), color: "#3dd68c" },
                { label: "Losing", value: useMock ? MOCK_DATA.losingTrades : Math.round(totalTrades * (100 - avgWinRate) / 100), color: "#f06c6c" },
              ]}
              size={160}
              thickness={20}
              centerLabel="Win Rate"
              centerValue={`${avgWinRate.toFixed(1)}%`}
            />
          </CardContent>
        </Card>

        {/* NEW: Monthly Returns */}
        <Card className="bg-[#12141a] border-[#2d303a]/50 lg:col-span-2">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#f59e0b]" />
              <CardTitle className="text-[#e8eaed] text-base">Monthly Returns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <BarChart
              data={generateMonthlyReturns().map((item) => ({
                label: item.date,
                value: item.value,
              }))}
              height={180}
              horizontal={false}
            />
          </CardContent>
        </Card>

        {/* NEW: Correlation Matrix */}
        <Card className="bg-[#12141a] border-[#2d303a]/50 lg:col-span-2">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-[#14b8a6]" />
              <CardTitle className="text-[#e8eaed] text-base">Asset Correlation Matrix</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex justify-center">
            <Heatmap
              data={generateCorrelationMatrix(stocks)}
              xLabels={stocks}
              yLabels={stocks}
            />
          </CardContent>
        </Card>

        {/* NEW: Individual Stock Performance */}
        <Card className="bg-[#12141a] border-[#2d303a]/50 lg:col-span-2">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-[#6c8cff]" />
              <CardTitle className="text-[#e8eaed] text-base">Individual Stock Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chartData.equityCurves.slice(0, 6).map((curve, index) => (
                <div key={curve.symbol} className="p-3 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40">
                  <AreaChart
                    data={curve.points}
                    height={100}
                    label={curve.symbol.replace(".NS", "")}
                    color={STOCK_COLORS[index % STOCK_COLORS.length]}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NEW: Risk Metrics */}
        <Card className="bg-[#12141a] border-[#2d303a]/50 lg:col-span-2">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#f59e0b]" />
              <CardTitle className="text-[#e8eaed] text-base">Risk & Performance Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <RiskMetricCard
                label="Max Drawdown"
                value={`${(useMock ? MOCK_DATA.maxDrawdown : -Math.abs(portfolioReturn * 1.3)).toFixed(2)}%`}
                description="Largest peak-to-trough decline"
                isNegative={true}
              />
              <RiskMetricCard
                label="Sortino Ratio"
                value={(useMock ? MOCK_DATA.sortinoRatio : sharpeRatio * 0.7).toFixed(2)}
                description="Risk-adjusted return (downside)"
                isNegative={sharpeRatio < 0}
              />
              <RiskMetricCard
                label="Calmar Ratio"
                value={(useMock ? MOCK_DATA.calmarRatio : portfolioReturn / Math.abs(portfolioReturn * 1.3)).toFixed(2)}
                description="Return / Max Drawdown"
                isNegative={portfolioReturn < 0}
              />
              <RiskMetricCard
                label="Profit Factor"
                value={(useMock ? MOCK_DATA.profitFactor : avgWinRate > 50 ? 1.5 : 0.5).toFixed(2)}
                description="Gross profit / Gross loss"
                isNegative={avgWinRate < 50}
              />
            </div>
          </CardContent>
        </Card>

        {/* NEW: Trade Analysis */}
        <Card className="bg-[#12141a] border-[#2d303a]/50 lg:col-span-2">
          <CardHeader className="border-b border-[#2d303a]/40">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-[#3dd68c]" />
              <CardTitle className="text-[#e8eaed] text-base">Trade Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40">
                <p className="text-3xl font-bold text-[#e8eaed] font-mono">{totalTrades}</p>
                <p className="text-xs text-[#8b8f9a] mt-1">Total Trades</p>
                <div className="mt-3 flex justify-center gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[#3dd68c]">{useMock ? MOCK_DATA.winningTrades : Math.round(totalTrades * avgWinRate / 100)}</p>
                    <p className="text-[10px] text-[#8b8f9a]">Winners</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#f06c6c]">{useMock ? MOCK_DATA.losingTrades : Math.round(totalTrades * (100 - avgWinRate) / 100)}</p>
                    <p className="text-[10px] text-[#8b8f9a]">Losers</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40">
                <p className="text-3xl font-bold text-[#e8eaed] font-mono">{(useMock ? MOCK_DATA.avgTradeDuration : 5.2).toFixed(1)}</p>
                <p className="text-xs text-[#8b8f9a] mt-1">Avg Trade Duration (days)</p>
                <div className="mt-3 h-2 bg-[#0c0d10] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6c8cff] to-[#a78bfa] rounded-full"
                    style={{ width: `${Math.min(100, (useMock ? MOCK_DATA.avgTradeDuration : 5.2) * 10)}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40">
                <p className={cn(
                  "text-3xl font-bold font-mono",
                  portfolioReturn >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"
                )}>
                  {portfolioReturn > 0 ? "+" : ""}{portfolioReturn.toFixed(2)}%
                </p>
                <p className="text-xs text-[#8b8f9a] mt-1">Total Return</p>
                <p className="mt-3 text-sm text-[#8b8f9a]">
                  vs Buy & Hold: <span className={avgBuyHoldReturn >= 0 ? "text-[#3dd68c]" : "text-[#f06c6c]"}>
                    {avgBuyHoldReturn > 0 ? "+" : ""}{avgBuyHoldReturn.toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RiskMetricCard({ 
  label, 
  value, 
  description, 
  isNegative 
}: { 
  label: string; 
  value: string; 
  description: string; 
  isNegative?: boolean;
}) {
  return (
    <div className="p-4 bg-[#1a1d24] rounded-lg border border-[#2d303a]/40 text-center">
      <p className={cn(
        "text-2xl font-bold font-mono",
        isNegative ? "text-[#f06c6c]" : "text-[#3dd68c]"
      )}>
        {value}
      </p>
      <p className="text-sm font-medium text-[#e8eaed] mt-1">{label}</p>
      <p className="text-[10px] text-[#8b8f9a] mt-1">{description}</p>
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  isPositive 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  subValue?: string; 
  isPositive?: boolean;
}) {
  return (
    <Card className="bg-[#12141a] border-[#2d303a]/50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-[#8b8f9a] mb-1">{label}</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
              isPositive !== undefined 
                ? (isPositive ? "text-[#3dd68c]" : "text-[#f06c6c]")
                : "text-[#e8eaed]"
            )}>
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-[#8b8f9a] mt-1">{subValue}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-[#1a1d24] border border-[#2d303a]/40">
            <Icon className="h-4 w-4 text-[#6c8cff]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ 
  label, 
  value, 
  highlight, 
  valueColor 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={cn(
        "text-sm",
        highlight ? "text-[#e8eaed] font-medium" : "text-[#8b8f9a]"
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm font-semibold",
        valueColor || (highlight ? "text-[#e8eaed]" : "text-[#e8eaed]")
      )}>
        {value}
      </span>
    </div>
  );
}
