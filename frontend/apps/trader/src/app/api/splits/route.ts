import { NextRequest, NextResponse } from "next/server";

const MOCK_SPLITS = [
  { symbol: "AAPL", date: "2020-08-31", splitRatio: "4:1" },
  { symbol: "TSLA", date: "2022-08-25", splitRatio: "3:1" },
  { symbol: "NVDA", date: "2021-07-20", splitRatio: "4:1" },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Alpha Vantage stock splits (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=SPLITS&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data) {
          return NextResponse.json({
            symbol,
            splits: data.data.map((split: any) => ({
              date: split.effective_date,
              splitFactor: split.split_factor,
              fromFactor: parseFloat(split.split_factor.split(":")[0]),
              toFactor: parseFloat(split.split_factor.split(":")[1]),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, splits: MOCK_SPLITS.filter(s => s.symbol === symbol) });
  } catch (error) {
    console.error("Error fetching stock splits:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, splits: MOCK_SPLITS.filter(s => s.symbol === symbol) });
  }
}
