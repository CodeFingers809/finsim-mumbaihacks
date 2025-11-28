import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteWatchlist,
  updateWatchlistName,
} from "@/lib/services/watchlists";
import { withAuth } from "@/lib/utils/safe-action";

const updateSchema = z.object({
  name: z.string().min(2).max(32),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  return withAuth(async (userId) =>
    updateWatchlistName(id, userId, parsed.data.name)
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (userId) => deleteWatchlist(id, userId));
}
