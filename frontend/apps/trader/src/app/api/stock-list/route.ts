import { NextRequest, NextResponse } from "next/server";
import { MOCK_STOCKS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const exchange = searchParams.get("exchange") || "NYSE"; // NYSE, NASDAQ, AMEX, etc.

  try {
    // FMP Stock List (FREE)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const url = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const filteredStocks = exchange === "ALL" 
            ? data 
            : data.filter((stock: any) => stock.exchange === exchange);
          
          return NextResponse.json({
            exchange,
            stocks: filteredStocks.slice(0, 5000).map((stock: any) => ({
              symbol: stock.symbol,
              name: stock.name,
              price: stock.price,
              exchange: stock.exchange,
              exchangeShortName: stock.exchangeShortName,
              type: stock.type,
            })),
          });
        }
      }
    }

    // Fallback to Finnhub
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      const url = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FINNHUB_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return NextResponse.json({
            exchange: "US",
            stocks: data.map((stock: any) => ({
              symbol: stock.symbol,
              name: stock.description,
              displaySymbol: stock.displaySymbol,
              type: stock.type,
              currency: stock.currency,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    const mockStockList = Object.entries(MOCK_STOCKS).map(([symbol, data]) => ({
      symbol,
      name: data.name,
      price: data.price,
      exchange: "NASDAQ",
      exchangeShortName: "NASDAQ",
      type: "stock"
    }));
    return NextResponse.json({ exchange, stocks: mockStockList });
  } catch (error) {
    console.error("Error fetching stock list:", error);
    // Return mock data on error
    const mockStockList = Object.entries(MOCK_STOCKS).map(([symbol, data]) => ({
      symbol,
      name: data.name,
      price: data.price,
      exchange: "NASDAQ",
      exchangeShortName: "NASDAQ",
      type: "stock"
    }));
    return NextResponse.json({ exchange, stocks: mockStockList });
  }
}
