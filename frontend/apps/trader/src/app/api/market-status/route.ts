import { NextRequest, NextResponse } from "next/server";

const MOCK_MARKET_STATUS = {
  exchange: "US",
  holiday: null,
  isOpen: false,
  session: "closed",
  timezone: "America/New_York",
  t: Date.now(),
};

export async function GET(request: NextRequest) {
  try {
    // Alpha Vantage Market Status (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=MARKET_STATUS&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 60 }, // Cache for 1 minute
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.markets) {
          return NextResponse.json({
            markets: data.markets.map((market: any) => ({
              marketType: market.market_type,
              region: market.region,
              primaryExchanges: market.primary_exchanges,
              localOpen: market.local_open,
              localClose: market.local_close,
              currentStatus: market.current_status,
              notes: market.notes,
            })),
          });
        }
      }
    }

    // Fallback to Finnhub (FREE)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      const url = `https://finnhub.io/api/v1/stock/market-status?exchange=US&token=${FINNHUB_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    }

    // Return mock data if no API data available
    return NextResponse.json(MOCK_MARKET_STATUS);
  } catch (error) {
    console.error("Error fetching market status:", error);
    // Return mock data on error
    return NextResponse.json(MOCK_MARKET_STATUS);
  }
}
