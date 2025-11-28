import { NextRequest, NextResponse } from "next/server";
import { MOCK_IPOS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    // Alpha Vantage IPO Calendar (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=IPO_CALENDAR&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const csvData = await response.text();
        const lines = csvData.trim().split("\n");
        
        if (lines.length > 1) {
          const headers = lines[0].split(",");
          const ipos = lines.slice(1).map((line) => {
            const values = line.split(",");
            return {
              symbol: values[0],
              name: values[1],
              ipoDate: values[2],
              priceRangeLow: parseFloat(values[3]) || 0,
              priceRangeHigh: parseFloat(values[4]) || 0,
              currency: values[5],
              exchange: values[6],
            };
          });

          return NextResponse.json({ ipos });
        }
      }
    }

    // Fallback to Finnhub (FREE)
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      const fromDate = from || new Date().toISOString().split("T")[0];
      const toDate = to || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      const url = `https://finnhub.io/api/v1/calendar/ipo?from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.ipoCalendar) {
          return NextResponse.json({
            ipos: data.ipoCalendar.map((ipo: any) => ({
              symbol: ipo.symbol,
              name: ipo.name,
              ipoDate: ipo.date,
              priceRangeLow: parseFloat(ipo.price?.split("-")[0]) || 0,
              priceRangeHigh: parseFloat(ipo.price?.split("-")[1]) || 0,
              numberOfShares: ipo.numberOfShares,
              totalSharesValue: ipo.totalSharesValue,
              status: ipo.status,
              exchange: ipo.exchange,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ ipos: MOCK_IPOS });
  } catch (error) {
    console.error("Error fetching IPO calendar:", error);
    // Return mock data on error
    return NextResponse.json({ ipos: MOCK_IPOS });
  }
}
