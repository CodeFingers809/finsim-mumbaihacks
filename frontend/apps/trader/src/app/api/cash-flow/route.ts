import { NextRequest, NextResponse } from "next/server";

const MOCK_CASH_FLOW = {
  fiscalDateEnding: "2023-12-31",
  reportedCurrency: "USD",
  operatingCashflow: "110543000000",
  capitalExpenditures: "-10959000000",
  freeCashFlow: "99584000000",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Alpha Vantage Cash Flow (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.symbol && (data.annualReports || data.quarterlyReports)) {
          return NextResponse.json({
            symbol: data.symbol,
            annualReports: data.annualReports?.map((report: any) => ({
              fiscalDateEnding: report.fiscalDateEnding,
              reportedCurrency: report.reportedCurrency,
              operatingCashflow: parseFloat(report.operatingCashflow),
              paymentsForOperatingActivities: parseFloat(report.paymentsForOperatingActivities),
              proceedsFromOperatingActivities: parseFloat(report.proceedsFromOperatingActivities),
              changeInOperatingLiabilities: parseFloat(report.changeInOperatingLiabilities),
              changeInOperatingAssets: parseFloat(report.changeInOperatingAssets),
              depreciationDepletionAndAmortization: parseFloat(report.depreciationDepletionAndAmortization),
              capitalExpenditures: parseFloat(report.capitalExpenditures),
              changeInReceivables: parseFloat(report.changeInReceivables),
              changeInInventory: parseFloat(report.changeInInventory),
              profitLoss: parseFloat(report.profitLoss),
              cashflowFromInvestment: parseFloat(report.cashflowFromInvestment),
              cashflowFromFinancing: parseFloat(report.cashflowFromFinancing),
              proceedsFromRepaymentsOfShortTermDebt: parseFloat(report.proceedsFromRepaymentsOfShortTermDebt),
              paymentsForRepurchaseOfCommonStock: parseFloat(report.paymentsForRepurchaseOfCommonStock),
              paymentsForRepurchaseOfEquity: parseFloat(report.paymentsForRepurchaseOfEquity),
              paymentsForRepurchaseOfPreferredStock: parseFloat(report.paymentsForRepurchaseOfPreferredStock),
              dividendPayout: parseFloat(report.dividendPayout),
              dividendPayoutCommonStock: parseFloat(report.dividendPayoutCommonStock),
              dividendPayoutPreferredStock: parseFloat(report.dividendPayoutPreferredStock),
              proceedsFromIssuanceOfCommonStock: parseFloat(report.proceedsFromIssuanceOfCommonStock),
              proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet: parseFloat(report.proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet),
              proceedsFromIssuanceOfPreferredStock: parseFloat(report.proceedsFromIssuanceOfPreferredStock),
              proceedsFromRepurchaseOfEquity: parseFloat(report.proceedsFromRepurchaseOfEquity),
              proceedsFromSaleOfTreasuryStock: parseFloat(report.proceedsFromSaleOfTreasuryStock),
              changeInCashAndCashEquivalents: parseFloat(report.changeInCashAndCashEquivalents),
              changeInExchangeRate: parseFloat(report.changeInExchangeRate),
              netIncome: parseFloat(report.netIncome),
            })),
            quarterlyReports: data.quarterlyReports?.slice(0, 4).map((report: any) => ({
              fiscalDateEnding: report.fiscalDateEnding,
              reportedCurrency: report.reportedCurrency,
              operatingCashflow: parseFloat(report.operatingCashflow),
              cashflowFromInvestment: parseFloat(report.cashflowFromInvestment),
              cashflowFromFinancing: parseFloat(report.cashflowFromFinancing),
              changeInCashAndCashEquivalents: parseFloat(report.changeInCashAndCashEquivalents),
              netIncome: parseFloat(report.netIncome),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, annualReports: [MOCK_CASH_FLOW] });
  } catch (error) {
    console.error("Error fetching cash flow:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, annualReports: [MOCK_CASH_FLOW] });
  }
}
