import { NextResponse } from "next/server";

import { fetchOptionChain } from "@/lib/api-clients/options";

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const { searchParams } = new URL(request.url);
  const expiry = searchParams.get("expiry") ?? undefined;
  try {
    const chain = await fetchOptionChain(symbol.toUpperCase(), expiry);
    return NextResponse.json(chain);
  } catch (error) {
    console.error("Option chain error:", error);
    return NextResponse.json({ calls: [], puts: [] });
  }
}
