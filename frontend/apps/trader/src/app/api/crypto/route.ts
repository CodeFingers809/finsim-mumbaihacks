import { NextRequest, NextResponse } from "next/server";

const MOCK_CRYPTO: Record<string, any> = {
  BTCUSD: { symbol: "BTCUSD", price: 43250.50, change: "+2.5%", volume: "25.5B" },
  ETHUSD: { symbol: "ETHUSD", price: 2345.80, change: "+1.8%", volume: "12.3B" },
  BNBUSD: { symbol: "BNBUSD", price: 315.45, change: "-0.5%", volume: "1.2B" },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol") || "BTC"; // BTC, ETH, etc.
  const market = searchParams.get("market") || "USD";

  try {
    // Alpha Vantage Crypto (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=${market}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data["Meta Data"] && data["Time Series (Digital Currency Daily)"]) {
          const timeSeries = data["Time Series (Digital Currency Daily)"];
          const latestDate = Object.keys(timeSeries)[0];
          const latest = timeSeries[latestDate];
          
          return NextResponse.json({
            symbol,
            market,
            metaData: data["Meta Data"],
            current: {
              date: latestDate,
              open: parseFloat(latest[`1a. open (${market})`]),
              high: parseFloat(latest[`2a. high (${market})`]),
              low: parseFloat(latest[`3a. low (${market})`]),
              close: parseFloat(latest[`4a. close (${market})`]),
              volume: parseFloat(latest["5. volume"]),
              marketCap: parseFloat(latest["6. market cap (USD)"]),
            },
            history: Object.entries(timeSeries).slice(0, 30).map(([date, values]: [string, any]) => ({
              date,
              open: parseFloat(values[`1a. open (${market})`]),
              high: parseFloat(values[`2a. high (${market})`]),
              low: parseFloat(values[`3a. low (${market})`]),
              close: parseFloat(values[`4a. close (${market})`]),
              volume: parseFloat(values["5. volume"]),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, ...MOCK_CRYPTO[symbol] });
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, ...MOCK_CRYPTO[symbol] });
  }
}
