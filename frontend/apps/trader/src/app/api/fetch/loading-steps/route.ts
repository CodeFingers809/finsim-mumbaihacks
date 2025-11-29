import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
    query: z.string(),
    topK: z.number().default(20),
    batchIndex: z.number().default(0),
});

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

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

        const { query, topK, batchIndex } = parsed.data;

        if (!GEMINI_API_KEY) {
            // Return fallback steps if no API key
            return NextResponse.json({
                steps: getFallbackSteps(query, topK),
            });
        }

        const prompt = `You are a RAG (Retrieval Augmented Generation) system loading message generator. Generate ${
            batchIndex === 0 ? 5 : 3
        } unique loading step messages for a financial document search process.

Context:
- Search Query: "${query}"
- Retrieving top ${topK} documents
- Batch: ${batchIndex + 1} (${
            batchIndex === 0 ? "initial steps" : "extended processing"
        })

${
    batchIndex === 0
        ? `Generate 5 steps covering:
1. Understanding and processing the search query
2. Generating semantic embeddings using vLLM
3. Searching through the financial data lake
4. Computing similarity scores
5. Ranking and preparing results`
        : `Generate 3 continuation steps for extended processing:
1. Re-ranking results for relevance
2. Extracting key insights from documents
3. Finalizing response`
}

Return ONLY a JSON array with objects having "title" (3-5 words) and "description" (1-2 sentences, technical but engaging). Make descriptions specific to the search query and financial context.

Example format:
[{"title": "Encoding Search Query", "description": "Using E5-Mistral embeddings to capture the semantic meaning of your query about revenue growth."}]`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        );

        if (!response.ok) {
            console.error("Gemini API error:", await response.text());
            return NextResponse.json({
                steps: getFallbackSteps(query, topK),
            });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extract JSON from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                const steps = JSON.parse(jsonMatch[0]);
                return NextResponse.json({ steps });
            } catch {
                console.error("Failed to parse Gemini response as JSON");
            }
        }

        return NextResponse.json({
            steps: getFallbackSteps(query, topK),
        });
    } catch (error) {
        console.error("Fetch loading steps API error:", error);
        return NextResponse.json(
            { error: "Failed to generate loading steps" },
            { status: 500 }
        );
    }
}

function getFallbackSteps(query: string, topK: number) {
    const queryPreview = query.length > 40 ? query.slice(0, 40) + "..." : query;

    // Extract potential keywords for more specific messages
    const hasRevenue = query.toLowerCase().includes("revenue");
    const hasGrowth = query.toLowerCase().includes("growth");
    const hasProfit = query.toLowerCase().includes("profit");
    const hasMarket = query.toLowerCase().includes("market");
    const hasRisk = query.toLowerCase().includes("risk");

    const focusArea = hasRevenue
        ? "revenue patterns"
        : hasGrowth
        ? "growth metrics"
        : hasProfit
        ? "profitability analysis"
        : hasMarket
        ? "market dynamics"
        : hasRisk
        ? "risk factors"
        : "financial insights";

    return [
        {
            title: "Processing Query",
            description: `Parsing your search: "${queryPreview}" and identifying key financial concepts.`,
        },
        {
            title: "Generating Embeddings",
            description: `Using E5-Mistral neural encoder to create a 4096-dimensional semantic representation of your query.`,
        },
        {
            title: "Searching Data Lake",
            description: `Scanning through indexed financial documents, analyst reports, and company filings for ${focusArea}.`,
        },
        {
            title: "Computing Similarity",
            description: `Calculating cosine similarity scores across document vectors to find the most relevant matches.`,
        },
        {
            title: `Ranking Top ${topK}`,
            description: `Sorting and selecting the ${topK} most semantically similar documents for your review.`,
        },
    ];
}

