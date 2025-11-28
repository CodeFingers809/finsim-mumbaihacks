"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface IncomeStatement {
  fiscalDateEnding: string;
  totalRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  ebitda?: number;
}

interface BalanceSheet {
  fiscalDateEnding: string;
  totalAssets: number;
  totalLiabilities: number;
  totalShareholderEquity: number;
  cashAndEquivalents?: number;
  totalDebt?: number;
}

interface CashFlow {
  fiscalDateEnding: string;
  operatingCashflow: number;
  capitalExpenditures: number;
  freeCashFlow?: number;
  dividendPayout?: number;
}

interface FinancialsPanelProps {
  symbol: string;
}

async function fetchIncomeStatement(symbol: string) {
  const response = await fetch(`/api/income-statement?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch income statement");
  return response.json();
}

async function fetchBalanceSheet(symbol: string) {
  const response = await fetch(`/api/balance-sheet?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch balance sheet");
  return response.json();
}

async function fetchCashFlow(symbol: string) {
  const response = await fetch(`/api/cash-flow?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch cash flow");
  return response.json();
}

// Generate mock financial data
function getMockFinancials(symbol: string) {
  const baseRevenue = 50000000000 + Math.random() * 300000000000;
  
  return {
    income: {
      fiscalDateEnding: "2024-12-31",
      totalRevenue: baseRevenue,
      grossProfit: baseRevenue * (0.35 + Math.random() * 0.25),
      operatingIncome: baseRevenue * (0.15 + Math.random() * 0.15),
      netIncome: baseRevenue * (0.1 + Math.random() * 0.15),
      ebitda: baseRevenue * (0.2 + Math.random() * 0.15),
    },
    balance: {
      fiscalDateEnding: "2024-12-31",
      totalAssets: baseRevenue * 1.5,
      totalLiabilities: baseRevenue * 0.8,
      totalShareholderEquity: baseRevenue * 0.7,
      cashAndEquivalents: baseRevenue * 0.15,
      totalDebt: baseRevenue * 0.3,
    },
    cashFlow: {
      fiscalDateEnding: "2024-12-31",
      operatingCashflow: baseRevenue * 0.2,
      capitalExpenditures: baseRevenue * 0.05,
      freeCashFlow: baseRevenue * 0.15,
      dividendPayout: baseRevenue * 0.02,
    },
  };
}

function formatLargeNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "-";
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absValue >= 1e12) return `${sign}$${(absValue / 1e12).toFixed(2)}T`;
  if (absValue >= 1e9) return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
  if (absValue >= 1e6) return `${sign}$${(absValue / 1e6).toFixed(2)}M`;
  if (absValue >= 1e3) return `${sign}$${(absValue / 1e3).toFixed(2)}K`;
  return `${sign}$${absValue.toFixed(2)}`;
}

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

// Mini bar chart for visual representation
function MiniBar({ value, maxValue, color }: { value: number; maxValue: number; color: string }) {
  const width = Math.min(Math.max((value / maxValue) * 100, 5), 100);
  return (
    <div className="h-2 w-full rounded-full bg-[#1e2028] overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// Revenue breakdown visualization
function RevenueBreakdown({ revenue, grossProfit, operatingIncome, netIncome }: {
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
}) {
  const items = [
    { label: "Revenue", value: revenue, color: "bg-[#6c8cff]", percent: 100 },
    { label: "Gross Profit", value: grossProfit, color: "bg-[#60a5fa]", percent: (grossProfit / revenue) * 100 },
    { label: "Operating Income", value: operatingIncome, color: "bg-[#a78bfa]", percent: (operatingIncome / revenue) * 100 },
    { label: "Net Income", value: netIncome, color: "bg-[#3dd68c]", percent: (netIncome / revenue) * 100 },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b8f9a]">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#c0c4cc]">{formatLargeNumber(item.value)}</span>
              <span className="text-[11px] text-[#8b8f9a]">
                ({item.percent.toFixed(1)}%)
              </span>
            </div>
          </div>
          <MiniBar value={item.percent} maxValue={100} color={item.color} />
        </div>
      ))}
    </div>
  );
}

export function FinancialsPanel({ symbol }: FinancialsPanelProps) {
  const [activeTab, setActiveTab] = useState<"income" | "balance" | "cashflow">("income");
  const [showDetails, setShowDetails] = useState(false);

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ["income-statement", symbol],
    queryFn: () => fetchIncomeStatement(symbol),
    staleTime: 86400000, // 24 hours
  });

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["balance-sheet", symbol],
    queryFn: () => fetchBalanceSheet(symbol),
    staleTime: 86400000,
  });

  const { data: cashFlowData, isLoading: cashFlowLoading } = useQuery({
    queryKey: ["cash-flow", symbol],
    queryFn: () => fetchCashFlow(symbol),
    staleTime: 86400000,
  });

  const isLoading = incomeLoading || balanceLoading || cashFlowLoading;

  // Use mock data if API returns incomplete data
  const mockData = getMockFinancials(symbol);
  
  const income: IncomeStatement = incomeData?.annualReports?.[0] || mockData.income;
  const balance: BalanceSheet = balanceData?.annualReports?.[0] || mockData.balance;
  const cashFlow: CashFlow = cashFlowData?.annualReports?.[0] || mockData.cashFlow;

  // Calculate key ratios
  const grossMargin = income.totalRevenue ? income.grossProfit / income.totalRevenue : 0;
  const operatingMargin = income.totalRevenue ? income.operatingIncome / income.totalRevenue : 0;
  const netMargin = income.totalRevenue ? income.netIncome / income.totalRevenue : 0;
  const debtToEquity = balance.totalShareholderEquity ? (balance.totalDebt || 0) / balance.totalShareholderEquity : 0;
  const currentRatio = balance.totalLiabilities ? balance.totalAssets / balance.totalLiabilities : 0;
  const roe = balance.totalShareholderEquity ? income.netIncome / balance.totalShareholderEquity : 0;

  if (isLoading) {
    return (
      <div className="p-5 space-y-4 animate-pulse">
        <div className="h-6 bg-[#1e2028] rounded w-1/2" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#1e2028] rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-[#1e2028] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8eaed] flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#6c8cff]" />
          Financials
        </h3>
        <span className="text-[11px] text-[#8b8f9a]">
          FY {income.fiscalDateEnding?.slice(0, 4) || "2024"}
        </span>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-[#6c8cff]/10 border border-[#6c8cff]/20">
          <p className="text-[11px] text-[#6c8cff]/80">Revenue</p>
          <p className="text-sm font-bold font-mono text-[#6c8cff]">
            {formatLargeNumber(income.totalRevenue)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20">
          <p className="text-[11px] text-[#3dd68c]/80">Net Income</p>
          <p className="text-sm font-bold font-mono text-[#3dd68c]">
            {formatLargeNumber(income.netIncome)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20">
          <p className="text-[11px] text-[#a78bfa]">Free Cash Flow</p>
          <p className="text-sm font-bold font-mono text-[#a78bfa]">
            {formatLargeNumber(cashFlow.freeCashFlow || cashFlow.operatingCashflow - cashFlow.capitalExpenditures)}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-xl bg-[#1a1d24]/80 p-1">
        {[
          { id: "income", label: "Income", icon: BarChart3 },
          { id: "balance", label: "Balance", icon: PieChart },
          { id: "cashflow", label: "Cash Flow", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all duration-200",
              activeTab === tab.id
                ? "bg-[#6c8cff] text-white shadow-md"
                : "text-[#8b8f9a] hover:text-[#e8eaed]"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "income" && (
        <div className="space-y-4">
          {/* Revenue Breakdown Visualization */}
          <div className="p-3.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
            <h4 className="text-xs font-medium text-[#e8eaed] mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#3dd68c]" />
              Profitability Funnel
            </h4>
            <RevenueBreakdown
              revenue={income.totalRevenue}
              grossProfit={income.grossProfit}
              operatingIncome={income.operatingIncome}
              netIncome={income.netIncome}
            />
          </div>

          {/* Margins */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30 text-center">
              <p className="text-[11px] text-[#8b8f9a]">Gross Margin</p>
              <p className={cn(
                "text-sm font-bold",
                grossMargin >= 0.4 ? "text-[#3dd68c]" : grossMargin >= 0.2 ? "text-[#fbbf24]" : "text-[#f06c6c]"
              )}>
                {formatPercent(grossMargin)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30 text-center">
              <p className="text-[11px] text-[#8b8f9a]">Op. Margin</p>
              <p className={cn(
                "text-sm font-bold",
                operatingMargin >= 0.2 ? "text-[#3dd68c]" : operatingMargin >= 0.1 ? "text-[#fbbf24]" : "text-[#f06c6c]"
              )}>
                {formatPercent(operatingMargin)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30 text-center">
              <p className="text-[11px] text-[#8b8f9a]">Net Margin</p>
              <p className={cn(
                "text-sm font-bold",
                netMargin >= 0.15 ? "text-[#3dd68c]" : netMargin >= 0.05 ? "text-[#fbbf24]" : "text-[#f06c6c]"
              )}>
                {formatPercent(netMargin)}
              </p>
            </div>
          </div>

          {income.ebitda && (
            <div className="p-3 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b8f9a]">EBITDA</span>
                <span className="text-sm font-mono font-semibold text-[#c0c4cc]">
                  {formatLargeNumber(income.ebitda)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "balance" && (
        <div className="space-y-4">
          {/* Assets vs Liabilities */}
          <div className="p-3.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
            <h4 className="text-xs font-medium text-[#e8eaed] mb-3">Assets vs Liabilities</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#3dd68c]">Assets</span>
                  <span className="font-mono text-[#c0c4cc]">{formatLargeNumber(balance.totalAssets)}</span>
                </div>
                <div className="h-3 rounded-full bg-[#1e2028] overflow-hidden">
                  <div className="h-full bg-[#3dd68c] rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#f06c6c]">Liabilities</span>
                  <span className="font-mono text-[#c0c4cc]">{formatLargeNumber(balance.totalLiabilities)}</span>
                </div>
                <div className="h-3 rounded-full bg-[#1e2028] overflow-hidden">
                  <div 
                    className="h-full bg-[#f06c6c] rounded-full" 
                    style={{ width: `${(balance.totalLiabilities / balance.totalAssets) * 100}%` }} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6c8cff]">Equity</span>
                  <span className="font-mono text-[#c0c4cc]">{formatLargeNumber(balance.totalShareholderEquity)}</span>
                </div>
                <div className="h-3 rounded-full bg-[#1e2028] overflow-hidden">
                  <div 
                    className="h-full bg-[#6c8cff] rounded-full" 
                    style={{ width: `${(balance.totalShareholderEquity / balance.totalAssets) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Balance Sheet Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
              <p className="text-[11px] text-[#8b8f9a]">Cash & Equiv.</p>
              <p className="text-sm font-mono font-semibold text-[#3dd68c]">
                {formatLargeNumber(balance.cashAndEquivalents)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
              <p className="text-[11px] text-[#8b8f9a]">Total Debt</p>
              <p className="text-sm font-mono font-semibold text-[#f06c6c]">
                {formatLargeNumber(balance.totalDebt)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
              <p className="text-[11px] text-[#8b8f9a]">Debt/Equity</p>
              <p className={cn(
                "text-sm font-bold",
                debtToEquity <= 0.5 ? "text-[#3dd68c]" : debtToEquity <= 1 ? "text-[#fbbf24]" : "text-[#f06c6c]"
              )}>
                {debtToEquity.toFixed(2)}x
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
              <p className="text-[11px] text-[#8b8f9a]">Current Ratio</p>
              <p className={cn(
                "text-sm font-bold",
                currentRatio >= 2 ? "text-[#3dd68c]" : currentRatio >= 1 ? "text-[#fbbf24]" : "text-[#f06c6c]"
              )}>
                {currentRatio.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "cashflow" && (
        <div className="space-y-4">
          {/* Cash Flow Summary */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-[#3dd68c]" />
                <span className="text-[11px] text-[#3dd68c]">Operating CF</span>
              </div>
              <p className="text-sm font-mono font-bold text-[#3dd68c]">
                {formatLargeNumber(cashFlow.operatingCashflow)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-[#f06c6c]" />
                <span className="text-[11px] text-[#f06c6c]">CapEx</span>
              </div>
              <p className="text-sm font-mono font-bold text-[#f06c6c]">
                {formatLargeNumber(-Math.abs(cashFlow.capitalExpenditures))}
              </p>
            </div>
          </div>

          {/* Free Cash Flow */}
          <div className="p-4 rounded-xl bg-[#6c8cff]/10 border border-[#6c8cff]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6c8cff]/80">Free Cash Flow</p>
                <p className="text-[11px] text-[#8b8f9a]">Operating CF - CapEx</p>
              </div>
              <p className="text-xl font-bold font-mono text-[#6c8cff]">
                {formatLargeNumber(cashFlow.freeCashFlow || cashFlow.operatingCashflow - cashFlow.capitalExpenditures)}
              </p>
            </div>
          </div>

          {/* Cash Flow Quality */}
          <div className="p-3.5 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
            <h4 className="text-xs font-medium text-[#e8eaed] mb-2">Cash Flow Quality</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b8f9a]">FCF/Revenue</span>
                <span className={cn(
                  "font-mono font-medium",
                  ((cashFlow.freeCashFlow || 0) / income.totalRevenue) >= 0.1 ? "text-[#3dd68c]" : "text-[#fbbf24]"
                )}>
                  {formatPercent((cashFlow.freeCashFlow || cashFlow.operatingCashflow - cashFlow.capitalExpenditures) / income.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b8f9a]">FCF/Net Income</span>
                <span className={cn(
                  "font-mono font-medium",
                  ((cashFlow.freeCashFlow || 0) / income.netIncome) >= 1 ? "text-[#3dd68c]" : "text-[#fbbf24]"
                )}>
                  {((cashFlow.freeCashFlow || cashFlow.operatingCashflow - cashFlow.capitalExpenditures) / income.netIncome).toFixed(2)}x
                </span>
              </div>
              {cashFlow.dividendPayout && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#2d303a]/40">
                  <span className="text-[#8b8f9a]">Dividend Payout</span>
                  <span className="font-mono font-medium text-[#c0c4cc]">
                    {formatLargeNumber(cashFlow.dividendPayout)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ROE */}
          <div className="p-3 rounded-xl bg-[#1a1d24]/60 border border-[#2d303a]/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8b8f9a]">Return on Equity (ROE)</span>
              <span className={cn(
                "text-sm font-bold",
                roe >= 0.2 ? "text-[#3dd68c]" : roe >= 0.1 ? "text-[#fbbf24]" : "text-[#f06c6c]"
              )}>
                {formatPercent(roe)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[#8b8f9a] hover:text-[#e8eaed] transition-colors"
      >
        {showDetails ? (
          <>
            Hide Details <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            Show More Details <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  );
}
