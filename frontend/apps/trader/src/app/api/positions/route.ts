import { NextResponse } from "next/server";

import { closePosition, getPositions } from "@/lib/services/positions";
import { withAuth } from "@/lib/utils/safe-action";

export async function GET() {
  return withAuth(async (userId) => getPositions(userId));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  return withAuth(async (userId) => closePosition(id, userId));
}
