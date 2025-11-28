import { NextResponse } from "next/server";

import { getBacktestResult } from "@/lib/services/backtests";
import { withAuth } from "@/lib/utils/safe-action";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    return withAuth(async (userId) => getBacktestResult(id, userId));
  } catch (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
