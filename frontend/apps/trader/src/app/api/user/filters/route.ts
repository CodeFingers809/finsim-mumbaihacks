import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserProfile, upsertUserFilters } from "@/lib/services/users";
import { withAuth } from "@/lib/utils/safe-action";

const updateSchema = z.object({
    phoneNumber: z.string().trim().min(8).max(20).optional().or(z.literal("")),
    scrips: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
});

export async function GET() {
    return withAuth(async (userId) => getUserProfile(userId));
}

export async function PUT(request: Request) {
    const payload = await request.json();
    const parsed = updateSchema.safeParse(payload);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 422 }
        );
    }

    const filters = {
        scrips: parsed.data.scrips ?? [],
        categories: parsed.data.categories ?? [],
        keywords: parsed.data.keywords ?? [],
    };

    return withAuth(async (userId) =>
        upsertUserFilters(userId, {
            phoneNumber: parsed.data.phoneNumber ?? null,
            filters,
        })
    );
}

