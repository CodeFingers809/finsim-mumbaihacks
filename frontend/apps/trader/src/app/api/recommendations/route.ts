import { NextRequest, NextResponse } from "next/server";

const MOCK_RECOMMENDATIONS = [
  { period: "2024-01", strongBuy: 15, buy: 12, hold: 8, sell: 2, strongSell: 0 },
  { period: "2023-12", strongBuy: 14, buy: 13, hold: 7, sell: 2, strongSell: 1 },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Finnhub Recommendation Trends (FREE)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            symbol,
            recommendations: data.map((rec: any) => ({
              period: rec.period,
              strongBuy: rec.strongBuy,
              buy: rec.buy,
              hold: rec.hold,
              sell: rec.sell,
              strongSell: rec.strongSell,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, recommendations: MOCK_RECOMMENDATIONS });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, recommendations: MOCK_RECOMMENDATIONS });
  }
}
