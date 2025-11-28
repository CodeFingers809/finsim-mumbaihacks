import { NextResponse } from "next/server";
import { z } from "zod";

import { simulateOrderPlacement } from "@/lib/services/orders";
import { withAuth } from "@/lib/utils/safe-action";

const legSchema = z.object({
  type: z.enum(["equity", "option"]),
  action: z.enum(["buy", "sell"]),
  symbol: z.string().min(1),
  strike: z.number().optional(),
  expiry: z.string().optional(),
  quantity: z.number().positive(),
  orderType: z.enum(["market", "limit"]),
  limitPrice: z.number().optional(),
});

const schema = z.object({
  strategyId: z.string().optional(),
  legs: z.array(legSchema).min(1),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  return withAuth(async (userId) => simulateOrderPlacement(userId, parsed.data));
}
