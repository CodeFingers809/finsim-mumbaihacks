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
  return NextResponse.json(quotes, { headers: { "cache-control": "no-store" } });
}
