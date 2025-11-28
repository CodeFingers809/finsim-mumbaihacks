import { NextRequest, NextResponse } from "next/server";
import { MOCK_TOP_MOVERS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    // Alpha Vantage Top Gainers/Losers (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 600 }, // Cache for 10 minutes
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.top_gainers && data.top_losers && data.most_actively_traded) {
          return NextResponse.json({
            metadata: data.metadata,
            lastUpdated: data.last_updated,
            topGainers: data.top_gainers.map((stock: any) => ({
              ticker: stock.ticker,
              price: parseFloat(stock.price),
              changeAmount: parseFloat(stock.change_amount),
              changePercentage: stock.change_percentage,
              volume: parseInt(stock.volume),
            })),
            topLosers: data.top_losers.map((stock: any) => ({
              ticker: stock.ticker,
              price: parseFloat(stock.price),
              changeAmount: parseFloat(stock.change_amount),
              changePercentage: stock.change_percentage,
              volume: parseInt(stock.volume),
            })),
            mostActivelyTraded: data.most_actively_traded.map((stock: any) => ({
              ticker: stock.ticker,
              price: parseFloat(stock.price),
              changeAmount: parseFloat(stock.change_amount),
              changePercentage: stock.change_percentage,
              volume: parseInt(stock.volume),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({
      metadata: "Top gainers, losers, and most actively traded US tickers",
      lastUpdated: new Date().toISOString().split("T")[0],
      ...MOCK_TOP_MOVERS,
    });
  } catch (error) {
    console.error("Error fetching market movers:", error);
    // Return mock data on error
    return NextResponse.json(MOCK_TOP_MOVERS);
  }
}
