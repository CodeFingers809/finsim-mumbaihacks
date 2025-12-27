import { NextResponse } from "next/server";

import { fetchMultipleQuotes } from "@/lib/api-clients/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols query param is required" }, { status: 400 });
  }
  const symbols = symbolsParam.split(",").map((symbol) => symbol.trim().toUpperCase());
  const quotes = await fetchMultipleQuotes(symbols);
  
  // Transform to match MarketQuote type with lastPrice
  const transformedQuotes = quotes.map(quote => ({
    symbol: quote.symbol,
    lastPrice: quote.price,
    change: quote.change,
    changePercent: quote.changesPercentage,
    dayHigh: quote.dayHigh,
    dayLow: quote.dayLow,
    open: quote.open,
    volume: quote.volume,
    previousClose: quote.previousClose,
  }));
  
  return NextResponse.json(transformedQuotes, { headers: { "cache-control": "no-store" } });
}
