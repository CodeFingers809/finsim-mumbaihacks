import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const FALLBACK_STEPS = [
    {
        title: "Analyzing Strategy Intent",
        description:
            "Parsing your natural language entry and exit conditions to understand the trading logic. Identifying key indicators like RSI, MACD, moving averages, and price action patterns.",
    },
    {
        title: "Generating Trading Code",
        description:
            "Using advanced AI to transform your strategy description into executable Python code compatible with the backtesting framework. Implementing proper risk management with stop-loss and take-profit levels.",
    },
    {
        title: "Fetching Historical Data",
        description:
            "Downloading OHLCV (Open, High, Low, Close, Volume) data from Yahoo Finance for all selected tickers. Cleaning and preparing the dataset for backtesting.",
    },
    {
        title: "Compiling Strategy",
        description:
            "Validating the generated code for syntax errors and logical consistency. Setting up indicator calculations and signal generation functions.",
    },
    {
        title: "Running Backtests",
        description:
            "Executing the strategy across all selected stocks with realistic commission costs. Simulating order execution and position management over the historical period.",
    },
    {
        title: "Calculating Portfolio Metrics",
        description:
            "Computing key performance indicators: Sharpe ratio, maximum drawdown, win rate, profit factor, and total returns. Comparing strategy performance against buy-and-hold benchmark.",
    },
    {
        title: "Generating Equity Curves",
        description:
            "Creating time-series data showing portfolio value evolution. Tracking individual stock performance and aggregating into portfolio-level metrics.",
    },
    {
        title: "Analyzing Results",
        description:
            "Running AI-powered verification to interpret what the backtest results mean. Generating actionable recommendations to improve strategy performance.",
    },
    {
        title: "Preparing Visualizations",
        description:
            "Building interactive charts for P&L distribution, strategy vs buy-and-hold comparison, correlation matrices, and drawdown analysis.",
    },
    {
        title: "Finalizing Report",
        description:
            "Compiling all metrics, charts, and AI analysis into a comprehensive backtest report. Ready to display your strategy's historical performance.",
    },
];

export async function POST(request: Request) {
    try {
        const { entryStrategy, exitStrategy, stocks } = await request.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Generate exactly 10 loading step messages for a trading strategy backtest process.
        
The user's strategy:
- Entry: "${entryStrategy}"
- Exit: "${exitStrategy}"
- Stocks: ${stocks.join(", ")}

Generate 10 JSON objects with "title" (3-5 words, action-oriented) and "description" (1-2 sentences explaining what's happening technically).

Make it feel like an agentic AI system is working through the backtest pipeline. Reference specific technical details like:
- Parsing RSI, MACD, moving averages from the strategy
- Code generation for backtesting.py
- Yahoo Finance data fetching
- Portfolio optimization
- Sharpe ratio, drawdown calculations

Output ONLY valid JSON array, no markdown:
[{"title": "...", "description": "..."}, ...]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Try to parse the response
        try {
            const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
            const steps = JSON.parse(cleanedText);
            if (Array.isArray(steps) && steps.length >= 5) {
                return NextResponse.json({ steps });
            }
        } catch {
            // Fall through to fallback
        }

        return NextResponse.json({ steps: FALLBACK_STEPS });
    } catch (error) {
        console.error("Loading steps generation error:", error);
        return NextResponse.json({ steps: FALLBACK_STEPS });
    }
}
