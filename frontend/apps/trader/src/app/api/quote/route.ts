import { NextRequest, NextResponse } from "next/server";
import { generateMockQuote } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // FMP Stock Quote (FREE with limits)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 5 }, // Cache for 5 seconds (near real-time)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const quote = data[0];
          return NextResponse.json({
            symbol: quote.symbol,
            name: quote.name,
            price: quote.price,
            lastPrice: quote.price,
            changesPercentage: quote.changesPercentage,
            change: quote.change,
            dayLow: quote.dayLow,
            dayHigh: quote.dayHigh,
            yearHigh: quote.yearHigh,
            yearLow: quote.yearLow,
            marketCap: quote.marketCap,
            priceAvg50: quote.priceAvg50,
            priceAvg200: quote.priceAvg200,
            volume: quote.volume,
            avgVolume: quote.avgVolume,
            open: quote.open,
            previousClose: quote.previousClose,
            eps: quote.eps,
            pe: quote.pe,
            earningsAnnouncement: quote.earningsAnnouncement,
            sharesOutstanding: quote.sharesOutstanding,
            timestamp: quote.timestamp,
          });
        }
      }
    }

    // Fallback to Alpha Vantage
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 5 },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data["Global Quote"]) {
          const quote = data["Global Quote"];
          return NextResponse.json({
            symbol: quote["01. symbol"],
            price: parseFloat(quote["05. price"]),
            change: parseFloat(quote["09. change"]),
            changesPercentage: parseFloat(quote["10. change percent"].replace("%", "")),
            open: parseFloat(quote["02. open"]),
            high: parseFloat(quote["03. high"]),
            low: parseFloat(quote["04. low"]),
            volume: parseInt(quote["06. volume"]),
            previousClose: parseFloat(quote["08. previous close"]),
            latestTradingDay: quote["07. latest trading day"],
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json(generateMockQuote(symbol));
  } catch (error) {
    console.error("Error fetching quote:", error);
    // Return mock data on error
    return NextResponse.json(generateMockQuote(symbol));
  }
}
