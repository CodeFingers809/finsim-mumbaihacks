import { NextResponse } from "next/server";
import { z } from "zod";

import { addStockToWatchlist } from "@/lib/services/watchlists";
import { withAuth } from "@/lib/utils/safe-action";

const schema = z.object({
  symbol: z.string().min(1).max(12),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  return withAuth(async (userId) =>
    addStockToWatchlist(id, userId, parsed.data.symbol.toUpperCase())
  );
}
