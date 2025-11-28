import { NextRequest, NextResponse } from "next/server";
import { MOCK_NEWS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const limit = searchParams.get("limit") || "10";

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // FMP Stock News (FREE)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=${limit}&apikey=${FMP_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return NextResponse.json({
            symbol,
            news: data.map((article: any) => ({
              symbol: article.symbol,
              publishedDate: article.publishedDate,
              title: article.title,
              image: article.image,
              site: article.site,
              text: article.text,
              url: article.url,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ symbol, news: MOCK_NEWS.filter(n => n.symbol === symbol || MOCK_NEWS.length < 3) });
  } catch (error) {
    console.error("Error fetching stock news:", error);
    // Return mock data on error
    return NextResponse.json({ symbol, news: MOCK_NEWS });
  }
}
