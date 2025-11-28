import { NextRequest, NextResponse } from "next/server";
import { MOCK_COMPANY_OVERVIEW } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Alpha Vantage Company Overview (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.Symbol) {
          return NextResponse.json({
            symbol: data.Symbol,
            assetType: data.AssetType,
            name: data.Name,
            description: data.Description,
            cik: data.CIK,
            exchange: data.Exchange,
            currency: data.Currency,
            country: data.Country,
            sector: data.Sector,
            industry: data.Industry,
            address: data.Address,
            fiscalYearEnd: data.FiscalYearEnd,
            latestQuarter: data.LatestQuarter,
            marketCapitalization: parseFloat(data.MarketCapitalization),
            ebitda: parseFloat(data.EBITDA),
            peRatio: parseFloat(data.PERatio),
            pegRatio: parseFloat(data.PEGRatio),
            bookValue: parseFloat(data.BookValue),
            dividendPerShare: parseFloat(data.DividendPerShare),
            dividendYield: parseFloat(data.DividendYield),
            eps: parseFloat(data.EPS),
            revenuePerShareTTM: parseFloat(data.RevenuePerShareTTM),
            profitMargin: parseFloat(data.ProfitMargin),
            operatingMarginTTM: parseFloat(data.OperatingMarginTTM),
            returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM),
            returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM),
            revenueTTM: parseFloat(data.RevenueTTM),
            grossProfitTTM: parseFloat(data.GrossProfitTTM),
            dilutedEPSTTM: parseFloat(data.DilutedEPSTTM),
            quarterlyEarningsGrowthYOY: parseFloat(data.QuarterlyEarningsGrowthYOY),
            quarterlyRevenueGrowthYOY: parseFloat(data.QuarterlyRevenueGrowthYOY),
            analystTargetPrice: parseFloat(data.AnalystTargetPrice),
            trailingPE: parseFloat(data.TrailingPE),
            forwardPE: parseFloat(data.ForwardPE),
            priceToSalesRatioTTM: parseFloat(data.PriceToSalesRatioTTM),
            priceToBookRatio: parseFloat(data.PriceToBookRatio),
            evToRevenue: parseFloat(data.EVToRevenue),
            evToEBITDA: parseFloat(data.EVToEBITDA),
            beta: parseFloat(data.Beta),
            week52High: parseFloat(data["52WeekHigh"]),
            week52Low: parseFloat(data["52WeekLow"]),
            day50MovingAverage: parseFloat(data["50DayMovingAverage"]),
            day200MovingAverage: parseFloat(data["200DayMovingAverage"]),
            sharesOutstanding: parseFloat(data.SharesOutstanding),
            dividendDate: data.DividendDate,
            exDividendDate: data.ExDividendDate,
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ ...MOCK_COMPANY_OVERVIEW, Symbol: symbol });
  } catch (error) {
    console.error("Error fetching company overview:", error);
    // Return mock data on error
    return NextResponse.json({ ...MOCK_COMPANY_OVERVIEW, Symbol: symbol });
  }
}
