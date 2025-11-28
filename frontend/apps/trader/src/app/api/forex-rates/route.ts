import { NextRequest, NextResponse } from "next/server";

const MOCK_FOREX_RATES: Record<string, any> = {
  "EUR/USD": { rate: 1.0856, timestamp: new Date().toISOString() },
  "GBP/USD": { rate: 1.2734, timestamp: new Date().toISOString() },
  "USD/JPY": { rate: 149.82, timestamp: new Date().toISOString() },
  "USD/INR": { rate: 83.25, timestamp: new Date().toISOString() },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromCurrency = searchParams.get("from") || "USD";
  const toCurrency = searchParams.get("to") || "EUR";

  try {
    // Alpha Vantage Forex (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data["Realtime Currency Exchange Rate"]) {
          const rate = data["Realtime Currency Exchange Rate"];
          return NextResponse.json({
            from: rate["1. From_Currency Code"],
            to: rate["3. To_Currency Code"],
            exchangeRate: parseFloat(rate["5. Exchange Rate"]),
            lastRefreshed: rate["6. Last Refreshed"],
            timezone: rate["7. Time Zone"],
            bidPrice: parseFloat(rate["8. Bid Price"]),
            askPrice: parseFloat(rate["9. Ask Price"]),
          });
        }
      }
    }

    // Return mock data if no API data available
    const pair = `${fromCurrency}/${toCurrency}`;
    return NextResponse.json({ pair, ...MOCK_FOREX_RATES[pair] });
  } catch (error) {
    console.error("Error fetching forex rates:", error);
    // Return mock data on error
    const pair = `${fromCurrency}/${toCurrency}`;
    return NextResponse.json({ pair, ...MOCK_FOREX_RATES[pair] });
  }
}
