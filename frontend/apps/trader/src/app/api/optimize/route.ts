import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
    tickers: z.array(z.string()).min(2, "Please provide at least 2 tickers"),
    capital: z.number().positive().default(10000),
});

export type OptimizeInput = z.infer<typeof schema>;

export interface PortfolioMetrics {
    return: number;
    volatility: number;
    sharpe: number;
    diversification_ratio: number;
    concentration_hhi: number;
    effective_assets: number;
    max_drawdown: number;
    var_95: number;
    cvar_95: number;
}

export interface PortfolioInsights {
    top_holding: { ticker: string; weight: number };
    is_concentrated: boolean;
    is_well_diversified: boolean;
}

export interface PortfolioStrategy {
    weights: Record<string, number>;
    allocation: Record<string, number>;
    risk_contribution: Record<string, number>;
    metrics: PortfolioMetrics;
    insights: PortfolioInsights;
}

export interface AssetMetrics {
    return: number;
    volatility: number;
    sharpe: number;
}

export interface CorrelationPair {
    pair: [string, string];
    correlation: number;
}

export interface CorrelationInsights {
    least_correlated: CorrelationPair[];
    most_correlated: CorrelationPair[];
    avg_correlation: number;
}

export interface AssetInsight {
    ticker: string;
    value: number;
}

export interface AssetInsights {
    best_return: AssetInsight;
    worst_return: AssetInsight;
    best_sharpe: AssetInsight;
    lowest_volatility: AssetInsight;
    highest_volatility: AssetInsight;
}

export interface Recommendation {
    type: "strategy" | "warning" | "positive" | "insight";
    title: string;
    description: string;
}

export interface StrategyComparison {
    best_return: string;
    lowest_risk: string;
    best_sharpe: string;
    most_diversified: string;
}

export interface OptimizeResponse {
    input: {
        tickers: string[];
        capital: number;
        valid_tickers_found: string[];
        data_period: string;
        trading_days_analyzed: number;
    };
    assets: Record<string, AssetMetrics>;
    asset_insights: AssetInsights;
    correlation_insights: CorrelationInsights;
    portfolios: {
        min_risk: PortfolioStrategy;
        max_sharpe: PortfolioStrategy;
        hrp: PortfolioStrategy;
        kelly: PortfolioStrategy;
    };
    strategy_comparison: StrategyComparison;
    recommendations: Recommendation[];
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

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

        const backendResponse = await fetch(`${BACKEND_URL}/optimize`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(parsed.data),
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error || "Backend request failed" },
                { status: backendResponse.status }
            );
        }

        const result: OptimizeResponse = await backendResponse.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Optimize API error:", error);
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

