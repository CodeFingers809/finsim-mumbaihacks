import { NextRequest, NextResponse } from "next/server";
import { MOCK_TOP_MOVERS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    // FMP Available Traded List (FREE) - Get most actively traded stocks
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const url = `https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${FMP_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return NextResponse.json({
            mostActive: data.map((stock: any) => ({
              symbol: stock.symbol,
              name: stock.name,
              change: stock.change,
              price: stock.price,
              changesPercentage: stock.changesPercentage,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ mostActive: MOCK_TOP_MOVERS.mostActivelyTraded });
  } catch (error) {
    console.error("Error fetching most active stocks:", error);
    // Return mock data on error
    return NextResponse.json({ mostActive: MOCK_TOP_MOVERS.mostActivelyTraded });
  }
}
