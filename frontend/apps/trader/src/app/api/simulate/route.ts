import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
    n_simulations: z.number().min(100).max(100000).default(1000),
    starting_capital: z.number().positive().default(10000),
    risk_per_trade: z.number().min(0).max(1).default(0.01),
    risk_reward_ratio: z.number().positive().default(1.5),
    win_rate: z.number().min(0).max(1).default(0.5),
    num_trades: z.number().min(10).max(5000).default(100),
});

export type SimulateInput = z.infer<typeof schema>;

export interface SimulateStatistics {
    mean_final_equity: number;
    median_final_equity: number;
    std_dev_equity: number;
    min_final_equity: number;
    max_final_equity: number;
    profit_probability: number;
    ruin_probability: number;
    mean_roi_pct: number;
    max_roi_pct: number;
    mean_max_drawdown_pct: number;
    worst_max_drawdown_pct: number;
    median_max_drawdown_pct: number;
}

export interface SimulateEquityCurves {
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
    best_case: number[];
    worst_case: number[];
}

export interface SimulateResponse {
    input_parameters: {
        n_simulations: number;
        starting_capital: number;
        risk_per_trade_pct: number;
        risk_reward_ratio: number;
        win_rate: number;
        num_trades: number;
    };
    statistics: SimulateStatistics;
    equity_curve_percentiles: SimulateEquityCurves;
    note: string;
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

        const backendResponse = await fetch(`${BACKEND_URL}/simulate`, {
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

        const result: SimulateResponse = await backendResponse.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Simulate API error:", error);
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

