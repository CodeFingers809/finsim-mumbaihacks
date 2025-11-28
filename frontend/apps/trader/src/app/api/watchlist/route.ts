import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createWatchlist,
  getWatchlists,
} from "@/lib/services/watchlists";
import { withAuth } from "@/lib/utils/safe-action";

const createSchema = z.object({
  name: z.string().min(2).max(32),
});

export async function GET() {
  return withAuth(async (userId) => getWatchlists(userId));
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  return withAuth(async (userId) => createWatchlist(userId, parsed.data.name));
}
