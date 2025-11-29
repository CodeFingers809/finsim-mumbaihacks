import { NextResponse } from "next/server";
import { z } from "zod";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const schema = z.object({
    query: z.string().min(1, "Query is required"),
    top_k: z.number().min(1).max(100).default(20),
    max_iterations: z.number().min(1).max(5).default(3),
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

        const { query, top_k, max_iterations } = parsed.data;

        // Call the Flask backend /agentic-rag endpoint
        const backendResponse = await fetch(`${BACKEND_URL}/agentic-rag`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                top_k,
                max_iterations,
            }),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: errorData.error || "Agentic RAG failed",
                    details: errorData,
                },
                { status: backendResponse.status }
            );
        }

        const result = await backendResponse.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Agentic RAG API error:", error);
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
        const backendResponse = await fetch(
            `${BACKEND_URL}/agentic-rag/health`,
            { method: "GET" }
        );

        if (!backendResponse.ok) {
            return NextResponse.json(
                { error: "Backend health check failed" },
                { status: backendResponse.status }
            );
        }

        const result = await backendResponse.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Agentic RAG health check error:", error);
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

