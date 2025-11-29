import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
    entryStrategy: z.string(),
    exitStrategy: z.string(),
    stocks: z.array(z.string()),
    capital: z.number(),
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

        const { entryStrategy, exitStrategy, stocks, capital, batchIndex } =
            parsed.data;

        if (!GEMINI_API_KEY) {
            // Return fallback steps if no API key
            return NextResponse.json({
                steps: getFallbackSteps(
                    entryStrategy,
                    exitStrategy,
                    stocks,
                    capital
                ),
            });
        }

        const prompt = `You are a trading system loading message generator. Generate ${
            batchIndex === 0 ? 6 : 4
        } unique loading step messages for a backtesting process.

Context:
- Entry Strategy: "${entryStrategy}"
- Exit Strategy: "${exitStrategy}"
- Stocks: ${stocks.join(", ")}
- Capital: ₹${capital.toLocaleString("en-IN")}
- Batch: ${batchIndex + 1} (${
            batchIndex === 0 ? "initial steps" : "continued processing"
        })

${
    batchIndex === 0
        ? `Generate the first 6 steps covering:
1. Parsing and understanding the strategy
2. Fetching historical data for the stocks
3. Computing relevant technical indicators (mention specific ones based on the strategy)
4. Generating entry/exit signals
5. Simulating trade execution
6. Analyzing initial results`
        : `Generate 4 continuation steps for extended processing:
1. Deep analysis or optimization
2. Additional calculations
3. Validation or verification
4. Final compilation`
}

Return ONLY a JSON array with objects having "title" (3-6 words) and "description" (1-2 sentences, technical but understandable). Make descriptions specific to the given strategy and stocks.

Example format:
[{"title": "Parsing RSI Conditions", "description": "Analyzing RSI threshold of 30 for entry signals across RELIANCE.NS and TCS.NS historical data."}]`;

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
                steps: getFallbackSteps(
                    entryStrategy,
                    exitStrategy,
                    stocks,
                    capital
                ),
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
            steps: getFallbackSteps(
                entryStrategy,
                exitStrategy,
                stocks,
                capital
            ),
        });
    } catch (error) {
        console.error("Loading steps API error:", error);
        return NextResponse.json(
            { error: "Failed to generate loading steps" },
            { status: 500 }
        );
    }
}

function getFallbackSteps(
    entryStrategy: string,
    exitStrategy: string,
    stocks: string[],
    capital: number
) {
    const stockList = stocks.slice(0, 3).join(", ").replace(/.NS/g, "");
    const hasRSI =
        entryStrategy.toLowerCase().includes("rsi") ||
        exitStrategy.toLowerCase().includes("rsi");
    const hasMACD =
        entryStrategy.toLowerCase().includes("macd") ||
        exitStrategy.toLowerCase().includes("macd");
    const hasSMA =
        entryStrategy.toLowerCase().includes("sma") ||
        entryStrategy.toLowerCase().includes("moving average");

    return [
        {
            title: "Parsing Strategy Logic",
            description: `Analyzing your entry condition "${entryStrategy.slice(
                0,
                50
            )}..." and exit rules using our NLP engine.`,
        },
        {
            title: `Fetching ${stocks.length} Stock Data`,
            description: `Retrieving 2 years of OHLCV data for ${stockList}${
                stocks.length > 3 ? ` and ${stocks.length - 3} more` : ""
            }.`,
        },
        {
            title: "Computing Indicators",
            description: `Calculating ${[
                hasRSI && "RSI",
                hasMACD && "MACD",
                hasSMA && "SMA",
                "momentum indicators",
            ]
                .filter(Boolean)
                .join(", ")} across all timeframes.`,
        },
        {
            title: "Generating Signals",
            description: `Applying entry/exit rules to identify trading opportunities with ₹${capital.toLocaleString(
                "en-IN"
            )} capital allocation.`,
        },
        {
            title: "Simulating Trades",
            description: `Running paper trades with realistic slippage and commission models for ${stockList}.`,
        },
        {
            title: "Compiling Results",
            description: `Aggregating performance metrics, equity curves, and trade-by-trade analysis for your dashboard.`,
        },
    ];
}

