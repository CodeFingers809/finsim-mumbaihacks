import { NextRequest, NextResponse } from "next/server";

interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "gainers"; // gainers, losers, active

  try {
    // FMP has excellent market movers data
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      try {
        const movers = await fetchFromFMP(type, FMP_API_KEY);
        console.log("FMP market movers fetched:", movers);
        if (movers.length > 0) {
          return NextResponse.json(movers);
        }
      } catch (error) {
        console.error("FMP market movers error:", error);
      }
    } else {
      console.error("FMP_API_KEY not found in environment variables");
    }

    // No API data available - return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching market movers:", error);
    return NextResponse.json([]);
  }
}



async function fetchFromFMP(type: string, apiKey: string): Promise<MoverStock[]> {
  try {
    const endpointMap: Record<string, string> = {
      gainers: "biggest-gainers",
      losers: "biggest-losers",
      active: "most-actives",
    };

    const endpoint = endpointMap[type] || "biggest-gainers";
    const url = `https://financialmodelingprep.com/stable/${endpoint}?apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 1 minute (market movers change frequently)
    });

    console.log("FMP market movers response:", response);

    if (!response.ok) return [];
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name || stock.companyName || stock.symbol,
        price: parseFloat(stock.price || "0"),
        change: parseFloat(stock.change || "0"),
        changePercent: parseFloat(stock.changesPercentage || "0"),
        volume: parseInt(stock.volume || "0"),
        marketCap: stock.marketCap ? parseInt(stock.marketCap) : undefined,
      }));
    }

    return [];
  } catch (error) {
    console.error("FMP market movers error:", error);
    return [];
  }
}
