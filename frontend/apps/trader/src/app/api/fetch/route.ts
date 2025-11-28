import { NextResponse } from "next/server";
import { z } from "zod";

const BACKEND_URL = process.env.BACKTEST_API_URL || "http://localhost:5000";

const schema = z.object({
    query: z.string().min(1, "Query is required"),
    top_k: z.number().min(1).max(100).default(20),
});

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const parsed = schema.safeParse(payload);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten() },
                { status: 422 }
            );
        }

        const { query, top_k } = parsed.data;

        // Call the Flask backend /fetch endpoint
        const backendResponse = await fetch(`${BACKEND_URL}/fetch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                top_k,
            }),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: errorData.error || "Fetch failed",
                    details: errorData,
                },
                { status: backendResponse.status }
            );
        }

        const result = await backendResponse.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Fetch API error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Health check endpoint
        const backendResponse = await fetch(`${BACKEND_URL}/fetch/health`, {
            method: "GET",
        });

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: "Backend health check failed" },
                { status: backendResponse.status }
            );
        }

        const result = await backendResponse.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Fetch health check error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            },
            { status: 500 }
        );
    }
}

