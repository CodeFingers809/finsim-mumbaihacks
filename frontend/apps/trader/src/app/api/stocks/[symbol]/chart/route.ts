import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") ?? "1Y";
  
  // Return empty array - chart data should come from real API
  return NextResponse.json([]);
}
