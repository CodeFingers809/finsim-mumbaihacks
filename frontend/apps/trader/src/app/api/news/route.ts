import { NextRequest, NextResponse } from "next/server";

// Using NewsAPI.org or similar - you'll need to sign up for a free API key
// Alternative: Use RSS feeds, Google News API, or Financial Modeling Prep API

interface NewsArticle {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  source: string;
  timestamp: string;
  url: string;
  imageUrl?: string;
  author?: string;
}

// Sentiment analysis helper (basic keyword-based)
function analyzeSentiment(title: string, description: string): "bullish" | "bearish" | "neutral" {
  const text = (title + " " + description).toLowerCase();
  
  const bullishKeywords = [
    "gain", "rise", "up", "surge", "profit", "growth", "strong", "beat", "exceed",
    "positive", "rally", "bullish", "upgrade", "buy", "soar", "record", "high",
    "success", "boost", "improve", "outperform", "win"
  ];
  
  const bearishKeywords = [
    "fall", "down", "drop", "loss", "decline", "weak", "miss", "cut",
    "negative", "bearish", "downgrade", "sell", "plunge", "low", "fail",
    "concern", "risk", "warning", "underperform", "lawsuit", "probe"
  ];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  bullishKeywords.forEach(keyword => {
    if (text.includes(keyword)) bullishScore++;
  });
  
  bearishKeywords.forEach(keyword => {
    if (text.includes(keyword)) bearishScore++;
  });
  
  if (bullishScore > bearishScore) return "bullish";
  if (bearishScore > bullishScore) return "bearish";
  return "neutral";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get("symbols")?.split(",") || [];

  if (symbols.length === 0) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  }

  try {
    // Try multiple finance-specific APIs in order of preference
    
    // 1. Financial Modeling Prep (FMP) - Best for stock-specific news
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      try {
        const articles = await fetchFromFMP(symbols, FMP_API_KEY);
        if (articles.length > 0) {
          return NextResponse.json(articles);
        }
      } catch (error) {
        console.error("FMP API error:", error);
      }
    }

    // 2. Alpha Vantage News Sentiment API
    const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_KEY) {
      try {
        const articles = await fetchFromAlphaVantage(symbols, ALPHA_VANTAGE_KEY);
        if (articles.length > 0) {
          return NextResponse.json(articles);
        }
      } catch (error) {
        console.error("Alpha Vantage API error:", error);
      }
    }

    // 3. Finnhub - Financial news API
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      try {
        const articles = await fetchFromFinnhub(symbols, FINNHUB_API_KEY);
        if (articles.length > 0) {
          return NextResponse.json(articles);
        }
      } catch (error) {
        console.error("Finnhub API error:", error);
      }
    }

    // 4. Polygon.io - Stock market news
    const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
    if (POLYGON_API_KEY) {
      try {
        const articles = await fetchFromPolygon(symbols, POLYGON_API_KEY);
        if (articles.length > 0) {
          return NextResponse.json(articles);
        }
      } catch (error) {
        console.error("Polygon API error:", error);
      }
    }

    // No API keys configured - return empty array
    console.warn("No finance API keys configured");
    return NextResponse.json([]);
    
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// Financial Modeling Prep API - Stock-specific news with excellent coverage
async function fetchFromFMP(symbols: string[], apiKey: string): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  for (const symbol of symbols.slice(0, 5)) {
    try {
      // FMP provides stock-specific news that's highly relevant
      const url = `https://financialmodelingprep.com/stable/news/stock?symbols=${symbol}&limit=5&apikey=${apiKey}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 },
      });

      if (!response.ok) continue;
      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((article: any) => {
          const sentiment = analyzeSentiment(article.title || "", article.text || "");
          
          articles.push({
            id: `${symbol}-${article.publishedDate}`,
            symbol,
            title: article.title || "No title",
            summary: article.text?.substring(0, 200) || "No description available",
            sentiment,
            source: article.site || "FMP",
            timestamp: article.publishedDate,
            url: article.url,
            imageUrl: article.image,
          });
        });
      }
    } catch (error) {
      console.error(`FMP error for ${symbol}:`, error);
    }
  }

  return articles.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 20);
}

// Alpha Vantage News Sentiment API - Includes sentiment scores
async function fetchFromAlphaVantage(symbols: string[], apiKey: string): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  for (const symbol of symbols.slice(0, 3)) {
    try {
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}&limit=5`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 },
      });

      if (!response.ok) continue;
      const data = await response.json();

      if (data.feed && Array.isArray(data.feed)) {
        data.feed.forEach((article: any) => {
          // Alpha Vantage provides sentiment scores
          const sentimentScore = article.overall_sentiment_score || 0;
          let sentiment: "bullish" | "bearish" | "neutral";
          
          if (sentimentScore > 0.15) sentiment = "bullish";
          else if (sentimentScore < -0.15) sentiment = "bearish";
          else sentiment = "neutral";

          articles.push({
            id: `${symbol}-${article.time_published}`,
            symbol,
            title: article.title || "No title",
            summary: article.summary?.substring(0, 200) || "No description available",
            sentiment,
            source: article.source || "Alpha Vantage",
            timestamp: article.time_published,
            url: article.url,
            imageUrl: article.banner_image,
            author: article.authors?.join(", "),
          });
        });
      }
    } catch (error) {
      console.error(`Alpha Vantage error for ${symbol}:`, error);
    }
  }

  return articles.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 20);
}

// Finnhub API - Company-specific news
async function fetchFromFinnhub(symbols: string[], apiKey: string): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  for (const symbol of symbols.slice(0, 5)) {
    try {
      const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${getDateDaysAgo(7)}&to=${getTodayDate()}&token=${apiKey}`;
      
      const response = await fetch(url, {
        next: { revalidate: 300 },
      });

      if (!response.ok) continue;
      const data = await response.json();

      if (Array.isArray(data)) {
        data.slice(0, 5).forEach((article: any) => {
          const sentiment = analyzeSentiment(article.headline || "", article.summary || "");
          
          articles.push({
            id: `${symbol}-${article.datetime}`,
            symbol,
            title: article.headline || "No title",
            summary: article.summary?.substring(0, 200) || "No description available",
            sentiment,
            source: article.source || "Finnhub",
            timestamp: new Date(article.datetime * 1000).toISOString(),
            url: article.url,
            imageUrl: article.image,
          });
        });
      }
    } catch (error) {
      console.error(`Finnhub error for ${symbol}:`, error);
    }
  }

  return articles.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 20);
}

// Polygon.io API - Market news with stock tickers
async function fetchFromPolygon(symbols: string[], apiKey: string): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  try {
    // Polygon allows querying multiple tickers at once
    const tickersParam = symbols.slice(0, 5).join(",");
    const url = `https://api.polygon.io/v2/reference/news?ticker=${tickersParam}&limit=20&apiKey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return articles;
    const data = await response.json();

    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((article: any) => {
        // Polygon includes tickers in the article
        const tickerSymbols = article.tickers || [];
        const matchedSymbol = tickerSymbols.find((t: string) => symbols.includes(t)) || symbols[0];
        
        const sentiment = analyzeSentiment(article.title || "", article.description || "");
        
        articles.push({
          id: `${matchedSymbol}-${article.published_utc}`,
          symbol: matchedSymbol,
          title: article.title || "No title",
          summary: article.description?.substring(0, 200) || "No description available",
          sentiment,
          source: article.publisher?.name || "Polygon",
          timestamp: article.published_utc,
          url: article.article_url,
          imageUrl: article.image_url,
          author: article.author,
        });
      });
    }
  } catch (error) {
    console.error("Polygon error:", error);
  }

  return articles.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 20);
}

// Helper functions
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}


