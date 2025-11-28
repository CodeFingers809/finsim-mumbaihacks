import { NextRequest, NextResponse } from "next/server";

interface InsiderTrade {
  symbol: string;
  companyName: string;
  filingDate: string;
  transactionDate: string;
  insider: string;
  title: string;
  transactionType: "P-Purchase" | "S-Sale" | "A-Award" | "M-Exercised" | string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  sharesOwned: number;
  link: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // FMP has excellent insider trading data
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      try {
        const trades = await fetchFromFMP(symbol, FMP_API_KEY, limit);
        if (trades.length > 0) {
          return NextResponse.json(trades);
        }
      } catch (error) {
        console.error("FMP insider trading error:", error);
      }
    }

    // Finnhub also has insider trading data
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      try {
        const trades = await fetchFromFinnhub(symbol, FINNHUB_API_KEY);
        if (trades.length > 0) {
          return NextResponse.json(trades);
        }
      } catch (error) {
        console.error("Finnhub insider trading error:", error);
      }
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching insider trading:", error);
    return NextResponse.json([]);
  }
}

async function fetchFromFMP(symbol: string, apiKey: string, limit: number): Promise<InsiderTrade[]> {
  try {
    const url = `https://financialmodelingprep.com/stable/insider-trading/search?symbol=${symbol}&limit=${limit}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    console.log("data", await response.json());

    if (!response.ok) return [];
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((trade: any) => ({
        symbol: trade.symbol,
        companyName: trade.companyName || symbol,
        filingDate: trade.filingDate,
        transactionDate: trade.transactionDate,
        insider: trade.reportingName,
        title: trade.typeOfOwner || "Insider",
        transactionType: trade.transactionType,
        shares: parseInt(trade.securitiesTransacted || "0"),
        pricePerShare: parseFloat(trade.price || "0"),
        totalValue: parseFloat(trade.securitiesTransacted || "0") * parseFloat(trade.price || "0"),
        sharesOwned: parseInt(trade.securitiesOwned || "0"),
        link: trade.link || "",
      }));
    }

    return [];
  } catch (error) {
    console.error(`FMP insider trading error for ${symbol}:`, error);
    return [];
  }
}

async function fetchFromFinnhub(symbol: string, apiKey: string): Promise<InsiderTrade[]> {
  try {
    const toDate = new Date().toISOString().split("T")[0];
    const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    const url = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((trade: any) => ({
        symbol: trade.symbol || symbol,
        companyName: trade.name || symbol,
        filingDate: trade.filingDate || trade.transactionDate,
        transactionDate: trade.transactionDate,
        insider: trade.name,
        title: "Insider",
        transactionType: trade.transactionCode || "N/A",
        shares: parseInt(trade.share || "0"),
        pricePerShare: parseFloat(trade.transactionPrice || "0"),
        totalValue: (parseInt(trade.share || "0") * parseFloat(trade.transactionPrice || "0")),
        sharesOwned: parseInt(trade.shareHoldAfterTransaction || "0"),
        link: "",
      }));
    }

    return [];
  } catch (error) {
    console.error(`Finnhub insider trading error for ${symbol}:`, error);
    return [];
  }
}
