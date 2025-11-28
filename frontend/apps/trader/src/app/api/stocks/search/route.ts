import { NextResponse } from "next/server";
import axios from "axios";

const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "demo";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

// Fallback popular stocks if API fails
const FALLBACK_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
  { symbol: "ITC.NS", name: "ITC Limited" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
  { symbol: "LT.NS", name: "Larsen & Toubro" },
  { symbol: "AXISBANK.NS", name: "Axis Bank" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki" },
  { symbol: "TITAN.NS", name: "Titan Company" },
  { symbol: "WIPRO", name: "Wipro" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NFLX", name: "Netflix Inc." },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase();

  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // Use Alpha Vantage SYMBOL_SEARCH endpoint
    const { data } = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: "SYMBOL_SEARCH",
        keywords: query,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 5000,
    });

    if (data.bestMatches && data.bestMatches.length > 0) {
      const results = data.bestMatches.slice(0, 10).map((match: any) => ({
        symbol: match["1. symbol"],
        name: match["2. name"],
      }));
      return NextResponse.json(results);
    }
  } catch (error) {
    console.warn("Alpha Vantage search failed, using fallback:", error);
  }

  // Fallback to local search
  const results = FALLBACK_STOCKS.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
  ).slice(0, 10);

  return NextResponse.json(results);
}
