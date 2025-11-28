"use client";

import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MiniAreaChart } from "@/components/charts/mini-area-chart";
import { useStrategyBuilder } from "@/hooks/use-strategy-builder";

function generatePayoff(legs: ReturnType<typeof useStrategyBuilder>["legs"]) {
  const points = Array.from({ length: 11 }, (_, idx) => {
    const underlying = 24000 + idx * 200;
    const payoff = legs.reduce((acc, leg) => {
      const intrinsic = leg.type === "option" && leg.strike
        ? Math.max(0, (leg.action === "buy" ? 1 : -1) * (underlying - leg.strike))
        : (leg.action === "buy" ? -1 : 1) * (underlying - (leg.limitPrice ?? underlying));
      return acc + intrinsic * leg.quantity;
    }, 0);
    return payoff;
  });
  return points;
}

export function StrategyBuilder() {
  const { name, setName, description, setDescription, legs, addLeg, updateLeg, removeLeg } =
    useStrategyBuilder();

  const payoff = useMemo(() => generatePayoff(legs), [legs]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/orders/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legs }),
      });
      if (!response.ok) throw new Error("Simulation failed");
      return response.json();
    },
    onSuccess: () => toast.success("Order simulated and added to positions"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to simulate order"),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card className="bg-surface/70">
        <CardHeader>
          <CardTitle>Strategy Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Strategy name" />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
          />
          <div className="space-y-3">
            {legs.map((leg, index) => (
              <div key={index} className="grid gap-3 rounded-2xl border border-border bg-black/20 p-4 md:grid-cols-6">
                <select
                  value={leg.type}
                  onChange={(event) => updateLeg(index, { type: event.target.value as "equity" | "option" })}
                  className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="equity">Equity</option>
                  <option value="option">Option</option>
                </select>
                <select
                  value={leg.action}
                  onChange={(event) => updateLeg(index, { action: event.target.value as "buy" | "sell" })}
                  className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
                <Input value={leg.symbol} onChange={(event) => updateLeg(index, { symbol: event.target.value })} />
                <Input
                  type="number"
                  placeholder="Strike"
                  value={leg.strike ?? ""}
                  onChange={(event) => updateLeg(index, { strike: Number(event.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={leg.quantity}
                  onChange={(event) => updateLeg(index, { quantity: Number(event.target.value) })}
                />
                <Button variant="ghost" onClick={() => removeLeg(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => addLeg()}>
            Add Leg
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-surface/70">
        <CardHeader>
          <CardTitle>Payoff Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MiniAreaChart data={payoff} />
          <div className="space-y-1 text-sm">
            <p>Max Profit: ₹{Math.max(...payoff).toFixed(2)}</p>
            <p>Max Loss: ₹{Math.min(...payoff).toFixed(2)}</p>
            <p>Breakeven: ₹{(24000 + payoff.indexOf(Math.min(...payoff)) * 200).toFixed(0)}</p>
          </div>
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Placing..." : "Place Order"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
