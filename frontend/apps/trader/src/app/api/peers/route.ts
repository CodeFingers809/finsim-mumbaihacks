import { NextRequest, NextResponse } from "next/server";

const MOCK_PEERS: Record<string, string[]> = {
  AAPL: ["MSFT", "GOOGL", "META", "AMZN"],
  TSLA: ["F", "GM", "RIVN", "LCID"],
  NVDA: ["AMD", "INTC", "TSM", "QCOM"],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Finnhub Company Peers (FREE)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      const url = `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return NextResponse.json({
            symbol,
            peers: data,
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, peers: MOCK_PEERS[symbol] || [] });
  } catch (error) {
    console.error("Error fetching peers:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, peers: MOCK_PEERS[symbol] || [] });
  }
}
