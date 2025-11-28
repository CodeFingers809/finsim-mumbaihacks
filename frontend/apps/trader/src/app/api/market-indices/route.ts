import { NextRequest, NextResponse } from "next/server";
import { MOCK_MARKET_INDICES } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    // FMP Stock Market Indices (FREE)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const symbols = "^GSPC,^DJI,^IXIC,^RUT"; // S&P 500, Dow Jones, NASDAQ, Russell 2000
      const url = `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${FMP_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 60 }, // Cache for 1 minute
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return NextResponse.json({
            indices: data.map((index: any) => ({
              symbol: index.symbol,
              name: index.name,
              price: index.price,
              changesPercentage: index.changesPercentage,
              change: index.change,
              dayLow: index.dayLow,
              dayHigh: index.dayHigh,
              yearHigh: index.yearHigh,
              yearLow: index.yearLow,
              open: index.open,
              previousClose: index.previousClose,
              timestamp: index.timestamp,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ indices: MOCK_MARKET_INDICES });
  } catch (error) {
    console.error("Error fetching market indices:", error);
    // Return mock data on error
    return NextResponse.json({ indices: MOCK_MARKET_INDICES });
  }
}
