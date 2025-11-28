import { NextRequest, NextResponse } from "next/server";
import { generateMockHistoricalData } from "@/lib/mock-data";

// Generate mock chart data for fallback
function generateChartData(symbol: string, days: number = 365) {
  const basePrice = 500 + Math.random() * 500;
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const trendFactor = (days - i) / days; // Slight upward trend
    const variance = (Math.random() - 0.5) * 15;
    const priceBase = basePrice * (1 + trendFactor * 0.2);
    const open = priceBase + variance;
    const close = open + (Math.random() - 0.5) * 8;
    const high = Math.max(open, close) + Math.random() * 4;
    const low = Math.min(open, close) - Math.random() * 4;
    const volume = Math.floor(500000 + Math.random() * 3000000);

    data.push({
      date: dateStr,
      time: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
  }

  return data;
}

// Get days based on timeframe
function getDaysForTimeframe(timeframe: string): number {
  switch (timeframe) {
    case "1m":
    case "5m":
    case "15m":
    case "1h":
    case "4h":
      return 5; // Intraday - last 5 days of data
    case "1D":
      return 90;
    case "1W":
      return 365;
    case "1M":
      return 365 * 3;
    case "1Y":
      return 365;
    default:
      return 365;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1Y";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  const days = getDaysForTimeframe(timeframe);

  try {
    // FMP Historical Price (FREE with limits - 5 years daily)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      let url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`;
      
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.historical && data.historical.length > 0) {
          // Return array directly for chart consumption
          const chartData = data.historical
            .slice(0, days)
            .reverse() // Oldest first for chart
            .map((day: any) => ({
              date: day.date,
              time: day.date,
              open: day.open,
              high: day.high,
              low: day.low,
              close: day.close,
              volume: day.volume,
            }));
          
          return NextResponse.json(chartData);
        }
      }
    }

    // Alpha Vantage fallback
    const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_KEY) {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 },
      });

      if (response.ok) {
        const data = await response.json();
        const timeSeries = data["Time Series (Daily)"];
        
        if (timeSeries) {
          const chartData = Object.entries(timeSeries)
            .slice(0, days)
            .reverse()
            .map(([date, values]: [string, any]) => ({
              date,
              time: date,
              open: parseFloat(values["1. open"]),
              high: parseFloat(values["2. high"]),
              low: parseFloat(values["3. low"]),
              close: parseFloat(values["4. close"]),
              volume: parseInt(values["5. volume"]),
            }));
          
          return NextResponse.json(chartData);
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json(generateChartData(symbol, days));
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    // Return mock data on error
    return NextResponse.json(generateChartData(symbol, days));
  }
}
