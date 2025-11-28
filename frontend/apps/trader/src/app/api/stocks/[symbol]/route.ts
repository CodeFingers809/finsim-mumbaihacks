import { fetchQuote } from "@/lib/api-clients/market-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const quote = await fetchQuote(symbol.toUpperCase());
  return Response.json(quote, { headers: { "cache-control": "no-store" } });
}
