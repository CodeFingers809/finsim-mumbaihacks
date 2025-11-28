import { NextRequest, NextResponse } from "next/server";

const MOCK_BALANCE_SHEET = {
  fiscalDateEnding: "2023-12-31",
  reportedCurrency: "USD",
  totalAssets: "352755000000",
  totalCurrentAssets: "135405000000",
  totalLiabilities: "290437000000",
  totalShareholderEquity: "62318000000",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Alpha Vantage Balance Sheet (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
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
              totalAssets: parseFloat(report.totalAssets),
              totalCurrentAssets: parseFloat(report.totalCurrentAssets),
              cashAndCashEquivalentsAtCarryingValue: parseFloat(report.cashAndCashEquivalentsAtCarryingValue),
              cashAndShortTermInvestments: parseFloat(report.cashAndShortTermInvestments),
              inventory: parseFloat(report.inventory),
              currentNetReceivables: parseFloat(report.currentNetReceivables),
              totalNonCurrentAssets: parseFloat(report.totalNonCurrentAssets),
              propertyPlantEquipment: parseFloat(report.propertyPlantEquipment),
              accumulatedDepreciationAmortizationPPE: parseFloat(report.accumulatedDepreciationAmortizationPPE),
              intangibleAssets: parseFloat(report.intangibleAssets),
              intangibleAssetsExcludingGoodwill: parseFloat(report.intangibleAssetsExcludingGoodwill),
              goodwill: parseFloat(report.goodwill),
              investments: parseFloat(report.investments),
              longTermInvestments: parseFloat(report.longTermInvestments),
              shortTermInvestments: parseFloat(report.shortTermInvestments),
              otherCurrentAssets: parseFloat(report.otherCurrentAssets),
              otherNonCurrentAssets: parseFloat(report.otherNonCurrentAssets),
              totalLiabilities: parseFloat(report.totalLiabilities),
              totalCurrentLiabilities: parseFloat(report.totalCurrentLiabilities),
              currentAccountsPayable: parseFloat(report.currentAccountsPayable),
              deferredRevenue: parseFloat(report.deferredRevenue),
              currentDebt: parseFloat(report.currentDebt),
              shortTermDebt: parseFloat(report.shortTermDebt),
              totalNonCurrentLiabilities: parseFloat(report.totalNonCurrentLiabilities),
              capitalLeaseObligations: parseFloat(report.capitalLeaseObligations),
              longTermDebt: parseFloat(report.longTermDebt),
              currentLongTermDebt: parseFloat(report.currentLongTermDebt),
              longTermDebtNoncurrent: parseFloat(report.longTermDebtNoncurrent),
              shortLongTermDebtTotal: parseFloat(report.shortLongTermDebtTotal),
              otherCurrentLiabilities: parseFloat(report.otherCurrentLiabilities),
              otherNonCurrentLiabilities: parseFloat(report.otherNonCurrentLiabilities),
              totalShareholderEquity: parseFloat(report.totalShareholderEquity),
              treasuryStock: parseFloat(report.treasuryStock),
              retainedEarnings: parseFloat(report.retainedEarnings),
              commonStock: parseFloat(report.commonStock),
              commonStockSharesOutstanding: parseFloat(report.commonStockSharesOutstanding),
            })),
            quarterlyReports: data.quarterlyReports?.slice(0, 4).map((report: any) => ({
              fiscalDateEnding: report.fiscalDateEnding,
              reportedCurrency: report.reportedCurrency,
              totalAssets: parseFloat(report.totalAssets),
              totalCurrentAssets: parseFloat(report.totalCurrentAssets),
              totalLiabilities: parseFloat(report.totalLiabilities),
              totalShareholderEquity: parseFloat(report.totalShareholderEquity),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, annualReports: [MOCK_BALANCE_SHEET] });
  } catch (error) {
    console.error("Error fetching balance sheet:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, annualReports: [MOCK_BALANCE_SHEET] });
  }
}
