import { NextRequest, NextResponse } from "next/server";

interface EarningsEvent {
  symbol: string;
  companyName: string;
  date: string;
  time: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  fiscalDateEnding: string;
  isPast: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const symbol = searchParams.get("symbol"); // Optional: specific symbol

  try {
    // Try FMP first (best earnings data)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      try {
        const earnings = symbol 
          ? await fetchSymbolEarningsFromFMP(symbol, FMP_API_KEY)
          : await fetchEarningsCalendarFromFMP(from, to, FMP_API_KEY);
        
        if (earnings.length > 0) {
          return NextResponse.json(earnings);
        }
      } catch (error) {
        console.error("FMP earnings error:", error);
      }
    }

    // Fallback to Alpha Vantage for specific symbol
    if (symbol) {
      const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
      if (ALPHA_VANTAGE_KEY) {
        try {
          const earnings = await fetchFromAlphaVantage(symbol, ALPHA_VANTAGE_KEY);
          if (earnings.length > 0) {
            return NextResponse.json(earnings);
          }
        } catch (error) {
          console.error("Alpha Vantage earnings error:", error);
        }
      }
    }

    // No API data available - return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching earnings calendar:", error);
    return NextResponse.json([]);
  }
}



async function fetchEarningsCalendarFromFMP(
  from: string | null,
  to: string | null,
  apiKey: string
): Promise<EarningsEvent[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const fromDate = from || today;
    const toDate = to || getDateDaysFromNow(30);

    const url = `https://financialmodelingprep.com/stable/earnings-calendar?from=${fromDate}&to=${toDate}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) return [];
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        symbol: item.symbol,
        companyName: item.name || item.symbol,
        date: item.date,
        time: item.time || "N/A",
        epsEstimate: item.epsEstimated ? parseFloat(item.epsEstimated) : null,
        epsActual: item.eps ? parseFloat(item.eps) : null,
        revenueEstimate: item.revenueEstimated ? parseFloat(item.revenueEstimated) : null,
        revenueActual: item.revenue ? parseFloat(item.revenue) : null,
        fiscalDateEnding: item.fiscalDateEnding || item.date,
        isPast: new Date(item.date) < new Date(),
      })).slice(0, 100); // Limit to 100 results
    }

    return [];
  } catch (error) {
    console.error("FMP earnings calendar error:", error);
    return [];
  }
}

async function fetchSymbolEarningsFromFMP(symbol: string, apiKey: string): Promise<EarningsEvent[]> {
  try {
    // Get historical earnings for a specific symbol
    const url = `https://financialmodelingprep.com/stable/earnings?symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        symbol: item.symbol,
        companyName: item.name || item.symbol,
        date: item.date,
        time: item.time || "N/A",
        epsEstimate: item.epsEstimated ? parseFloat(item.epsEstimated) : null,
        epsActual: item.eps ? parseFloat(item.eps) : null,
        revenueEstimate: item.revenueEstimated ? parseFloat(item.revenueEstimated) : null,
        revenueActual: item.revenue ? parseFloat(item.revenue) : null,
        fiscalDateEnding: item.fiscalDateEnding || item.date,
        isPast: new Date(item.date) < new Date(),
      })).slice(0, 20);
    }

    return [];
  } catch (error) {
    console.error(`FMP earnings error for ${symbol}:`, error);
    return [];
  }
}

async function fetchFromAlphaVantage(symbol: string, apiKey: string): Promise<EarningsEvent[]> {
  try {
    const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    const data = await response.json();

    const earnings: EarningsEvent[] = [];

    // Quarterly earnings
    if (data.quarterlyEarnings && Array.isArray(data.quarterlyEarnings)) {
      data.quarterlyEarnings.slice(0, 12).forEach((item: any) => {
        earnings.push({
          symbol,
          companyName: symbol,
          date: item.reportedDate || item.fiscalDateEnding,
          time: "N/A",
          epsEstimate: item.estimatedEPS ? parseFloat(item.estimatedEPS) : null,
          epsActual: item.reportedEPS ? parseFloat(item.reportedEPS) : null,
          revenueEstimate: null,
          revenueActual: null,
          fiscalDateEnding: item.fiscalDateEnding,
          isPast: true,
        });
      });
    }

    return earnings;
  } catch (error) {
    console.error(`Alpha Vantage earnings error for ${symbol}:`, error);
    return [];
  }
}

function getDateDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}
