import { removeStockFromWatchlist } from "@/lib/services/watchlists";
import { withAuth } from "@/lib/utils/safe-action";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; symbol: string }> }
) {
  const { id, symbol } = await params;
  return withAuth(async (userId) =>
    removeStockFromWatchlist(id, userId, symbol)
  );
}
