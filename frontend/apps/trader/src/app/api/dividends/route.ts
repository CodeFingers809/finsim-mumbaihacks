import { NextRequest, NextResponse } from "next/server";

const MOCK_DIVIDENDS = {
  AAPL: [
    { exDate: "2024-11-08", paymentDate: "2024-11-14", recordDate: "2024-11-11", declarationDate: "2024-10-31", amount: 0.24, adjustedAmount: 0.24 },
    { exDate: "2024-08-09", paymentDate: "2024-08-15", recordDate: "2024-08-12", declarationDate: "2024-08-01", amount: 0.24, adjustedAmount: 0.24 },
    { exDate: "2024-05-10", paymentDate: "2024-05-16", recordDate: "2024-05-13", declarationDate: "2024-05-02", amount: 0.24, adjustedAmount: 0.24 },
    { exDate: "2024-02-09", paymentDate: "2024-02-15", recordDate: "2024-02-12", declarationDate: "2024-02-01", amount: 0.24, adjustedAmount: 0.24 },
  ],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Alpha Vantage dividends (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=DIVIDENDS&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data) {
          return NextResponse.json({
            symbol,
            dividends: data.data.map((div: any) => ({
              exDate: div.ex_dividend_date,
              paymentDate: div.payment_date,
              recordDate: div.record_date,
              declarationDate: div.declaration_date,
              amount: parseFloat(div.amount),
              adjustedAmount: parseFloat(div.adjusted_amount || div.amount),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    const mockData = MOCK_DIVIDENDS[symbol as keyof typeof MOCK_DIVIDENDS] || MOCK_DIVIDENDS.AAPL;
    return NextResponse.json({ symbol, dividends: mockData });
  } catch (error) {
    console.error("Error fetching dividends:", error);
    // Return mock data on error
    const mockData = MOCK_DIVIDENDS[symbol as keyof typeof MOCK_DIVIDENDS] || MOCK_DIVIDENDS.AAPL;
    return NextResponse.json({ symbol, dividends: mockData });
  }
}
