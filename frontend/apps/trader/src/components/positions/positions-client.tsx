"use client";

import type { Position } from "@trader/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

async function fetchPositions(): Promise<Position[]> {
    const response = await fetch("/api/positions", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to fetch positions");
    return response.json();
}

export function PositionsClient() {
    const queryClient = useQueryClient();
    const { data = [], isLoading } = useQuery({
        queryKey: ["positions"],
        queryFn: fetchPositions,
        refetchInterval: 15000,
    });

    const closeMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/positions?id=${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Unable to close position");
            return response.json();
        },
        onSuccess: () => {
            toast.success("Position closed");
            queryClient.invalidateQueries({ queryKey: ["positions"] });
        },
        onError: (error) =>
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to close position"
            ),
    });

    return (
        <Card className="bg-surface/70">
            <CardHeader>
                <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-text-secondary">
                        Loading positions...
                    </p>
                ) : (
                    <Table>
                        <THead>
                            <TR>
                                <TH>Symbol</TH>
                                <TH>Type</TH>
                                <TH>Qty</TH>
                                <TH>Entry</TH>
                                <TH>Last</TH>
                                <TH>P&L</TH>
                                <TH>Action</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {data.map((position) => (
                                <TR key={position._id}>
                                    <TD>{position.symbol}</TD>
                                    <TD>{position.type}</TD>
                                    <TD>{position.quantity}</TD>
                                    <TD>₹{position.entryPrice.toFixed(2)}</TD>
                                    <TD>₹{position.currentPrice.toFixed(2)}</TD>
                                    <TD
                                        className={
                                            position.pnl >= 0
                                                ? "text-success"
                                                : "text-danger"
                                        }
                                    >
                                        ₹{position.pnl.toFixed(2)}
                                    </TD>
                                    <TD>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                closeMutation.mutate(
                                                    position._id
                                                )
                                            }
                                        >
                                            Close
                                        </Button>
                                    </TD>
                                </TR>
                            ))}
                            {!data.length && (
                                <TR>
                                    <TD
                                        colSpan={7}
                                        className="py-6 text-center text-sm text-text-secondary"
                                    >
                                        No positions yet. Simulate a strategy to
                                        populate this view.
                                    </TD>
                                </TR>
                            )}
                        </TBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

