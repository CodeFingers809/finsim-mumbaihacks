import { NextRequest, NextResponse } from "next/server";
import { MOCK_NEWS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit") || "20";

  try {
    // FMP General News (FREE)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const url = `https://financialmodelingprep.com/api/v3/fmp/articles?page=0&size=${limit}&apikey=${FMP_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.content && Array.isArray(data.content)) {
          return NextResponse.json({
            news: data.content.map((article: any) => ({
              title: article.title,
              date: article.date,
              content: article.content,
              tickers: article.tickers,
              image: article.image,
              link: article.link,
              author: article.author,
              site: article.site,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ news: MOCK_NEWS });
  } catch (error) {
    console.error("Error fetching general news:", error);
    // Return mock data on error
    return NextResponse.json({ news: MOCK_NEWS });
  }
}
