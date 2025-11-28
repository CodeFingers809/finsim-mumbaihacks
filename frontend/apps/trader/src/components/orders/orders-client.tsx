import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockOrders = [
    {
        id: "ORD-0001",
        symbol: "SAATVIKGL",
        type: "BUY",
        quantity: 50,
        price: 416.15,
        status: "Executed",
        time: "25 Nov 2025 · 15:40",
    },
    {
        id: "ORD-0002",
        symbol: "NIFTY25NOV25900CE",
        type: "SELL",
        quantity: 2,
        price: 135.97,
        status: "Pending",
        time: "25 Nov 2025 · 15:45",
    },
];

export function OrdersClient() {
    return (
        <Card className="bg-surface/70">
            <CardHeader>
                <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockOrders.map((order) => (
                    <div
                        key={order.id}
                        className="rounded-2xl border border-border bg-black/20 p-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">
                                    {order.id}
                                </p>
                                <p className="text-xl font-semibold">
                                    {order.symbol}
                                </p>
                                <p className="text-sm text-text-secondary">
                                    {order.time}
                                </p>
                            </div>
                            <div className="text-right text-sm">
                                <p>
                                    {order.type} · {order.quantity} @ ₹
                                    {order.price}
                                </p>
                                <Badge
                                    variant={
                                        order.status === "Executed"
                                            ? "success"
                                            : "warning"
                                    }
                                >
                                    {order.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

