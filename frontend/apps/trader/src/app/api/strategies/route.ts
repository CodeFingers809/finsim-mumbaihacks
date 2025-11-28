import { NextResponse } from "next/server";
import { z } from "zod";

import { createStrategy, getStrategies } from "@/lib/services/strategies";
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

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  legs: z.array(legSchema).min(1),
});

export async function GET() {
  return withAuth(async (userId) => getStrategies(userId));
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Convert expiry strings to Date objects
  const strategyData = {
    ...parsed.data,
    legs: parsed.data.legs.map((leg) => ({
      ...leg,
      expiry: leg.expiry ? new Date(leg.expiry) : undefined,
    })),
  };

  return withAuth(async (userId) => createStrategy(userId, strategyData));
}
