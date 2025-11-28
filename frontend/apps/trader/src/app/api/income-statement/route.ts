import { NextRequest, NextResponse } from "next/server";

const MOCK_INCOME_STATEMENT = {
  fiscalDateEnding: "2023-12-31",
  reportedCurrency: "USD",
  totalRevenue: "394328000000",
  costOfRevenue: "214137000000",
  grossProfit: "180191000000",
  operatingIncome: "114301000000",
  netIncome: "96995000000",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Alpha Vantage Income Statement (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
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
              grossProfit: parseFloat(report.grossProfit),
              totalRevenue: parseFloat(report.totalRevenue),
              costOfRevenue: parseFloat(report.costOfRevenue),
              costofGoodsAndServicesSold: parseFloat(report.costofGoodsAndServicesSold),
              operatingIncome: parseFloat(report.operatingIncome),
              sellingGeneralAndAdministrative: parseFloat(report.sellingGeneralAndAdministrative),
              researchAndDevelopment: parseFloat(report.researchAndDevelopment),
              operatingExpenses: parseFloat(report.operatingExpenses),
              investmentIncomeNet: parseFloat(report.investmentIncomeNet),
              netInterestIncome: parseFloat(report.netInterestIncome),
              interestIncome: parseFloat(report.interestIncome),
              interestExpense: parseFloat(report.interestExpense),
              nonInterestIncome: parseFloat(report.nonInterestIncome),
              otherNonOperatingIncome: parseFloat(report.otherNonOperatingIncome),
              depreciation: parseFloat(report.depreciation),
              depreciationAndAmortization: parseFloat(report.depreciationAndAmortization),
              incomeBeforeTax: parseFloat(report.incomeBeforeTax),
              incomeTaxExpense: parseFloat(report.incomeTaxExpense),
              interestAndDebtExpense: parseFloat(report.interestAndDebtExpense),
              netIncomeFromContinuingOperations: parseFloat(report.netIncomeFromContinuingOperations),
              comprehensiveIncomeNetOfTax: parseFloat(report.comprehensiveIncomeNetOfTax),
              ebit: parseFloat(report.ebit),
              ebitda: parseFloat(report.ebitda),
              netIncome: parseFloat(report.netIncome),
            })),
            quarterlyReports: data.quarterlyReports?.slice(0, 4).map((report: any) => ({
              fiscalDateEnding: report.fiscalDateEnding,
              reportedCurrency: report.reportedCurrency,
              grossProfit: parseFloat(report.grossProfit),
              totalRevenue: parseFloat(report.totalRevenue),
              costOfRevenue: parseFloat(report.costOfRevenue),
              operatingIncome: parseFloat(report.operatingIncome),
              operatingExpenses: parseFloat(report.operatingExpenses),
              netIncome: parseFloat(report.netIncome),
              ebit: parseFloat(report.ebit),
              ebitda: parseFloat(report.ebitda),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, annualReports: [MOCK_INCOME_STATEMENT] });
  } catch (error) {
    console.error("Error fetching income statement:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, annualReports: [MOCK_INCOME_STATEMENT] });
  }
}
