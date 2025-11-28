import { NextRequest, NextResponse } from "next/server";

interface ScreenerStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe?: number;
  eps?: number;
  beta?: number;
  dividendYield?: number;
  sector?: string;
  industry?: string;
  exchange?: string;
}

interface ScreenerFilters {
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPE?: number;
  maxPE?: number;
  sector?: string;
  exchange?: string;
  limit?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const filters: ScreenerFilters = {
    minPrice: parseFloat(searchParams.get("minPrice") || "0"),
    maxPrice: parseFloat(searchParams.get("maxPrice") || "999999"),
    minVolume: parseInt(searchParams.get("minVolume") || "0"),
    minMarketCap: parseInt(searchParams.get("minMarketCap") || "0"),
    maxMarketCap: parseInt(searchParams.get("maxMarketCap") || "999999999999"),
    minPE: parseFloat(searchParams.get("minPE") || "0"),
    maxPE: parseFloat(searchParams.get("maxPE") || "999"),
    sector: searchParams.get("sector") || undefined,
    exchange: searchParams.get("exchange") || undefined,
    limit: parseInt(searchParams.get("limit") || "100"),
  };

  try {
    // FMP has excellent screener capabilities
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      try {
        const stocks = await fetchFromFMP(filters, FMP_API_KEY);
        if (stocks.length > 0) {
          return NextResponse.json(stocks);
        }
      } catch (error) {
        console.error("FMP screener error:", error);
      }
    }

    // Finnhub fallback
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      try {
        const stocks = await fetchFromFinnhub(filters, FINNHUB_API_KEY);
        if (stocks.length > 0) {
          return NextResponse.json(stocks);
        }
      } catch (error) {
        console.error("Finnhub screener error:", error);
      }
    }

    // No API data available - return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching screener data:", error);
    return NextResponse.json([]);
  }
}



async function fetchFromFMP(filters: ScreenerFilters, apiKey: string): Promise<ScreenerStock[]> {
  try {
    // Build FMP screener query
    const params = new URLSearchParams({
      apikey: apiKey,
      limit: (filters.limit || 100).toString(),
    });

    // Add optional filters
    if (filters.minMarketCap) params.append("marketCapMoreThan", filters.minMarketCap.toString());
    if (filters.maxMarketCap && filters.maxMarketCap < 999999999999) {
      params.append("marketCapLowerThan", filters.maxMarketCap.toString());
    }
    if (filters.minVolume) params.append("volumeMoreThan", filters.minVolume.toString());
    if (filters.minPrice) params.append("priceMoreThan", filters.minPrice.toString());
    if (filters.maxPrice && filters.maxPrice < 999999) {
      params.append("priceLowerThan", filters.maxPrice.toString());
    }
    if (filters.minPE) params.append("peMoreThan", filters.minPE.toString());
    if (filters.maxPE && filters.maxPE < 999) params.append("peLowerThan", filters.maxPE.toString());
    if (filters.sector) params.append("sector", filters.sector);
    if (filters.exchange) params.append("exchange", filters.exchange);

    const url = `https://financialmodelingprep.com/stable/company-screener?${params.toString()}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) return [];
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.companyName,
        price: parseFloat(stock.price || "0"),
        change: parseFloat(stock.change || "0"),
        changePercent: parseFloat(stock.changesPercentage || "0"),
        volume: parseInt(stock.volume || "0"),
        marketCap: parseInt(stock.marketCap || "0"),
        pe: stock.pe ? parseFloat(stock.pe) : undefined,
        eps: stock.eps ? parseFloat(stock.eps) : undefined,
        beta: stock.beta ? parseFloat(stock.beta) : undefined,
        dividendYield: stock.lastDiv ? parseFloat(stock.lastDiv) : undefined,
        sector: stock.sector,
        industry: stock.industry,
        exchange: stock.exchangeShortName,
      }));
    }

    return [];
  } catch (error) {
    console.error("FMP screener error:", error);
    return [];
  }
}

async function fetchFromFinnhub(filters: ScreenerFilters, apiKey: string): Promise<ScreenerStock[]> {
  try {
    // Finnhub doesn't have a screener API, so we'll fetch US stocks and filter
    const url = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) return [];
    const symbols = await response.json();

    // Limit to avoid too many quote requests
    const limitedSymbols = symbols.slice(0, Math.min(50, filters.limit || 50));

    // Fetch quotes for each symbol
    const quotes = await Promise.all(
      limitedSymbols.map(async (stock: any) => {
        try {
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`;
          const quoteResponse = await fetch(quoteUrl, {
            next: { revalidate: 60 },
          });
          const quoteData = await quoteResponse.json();

          return {
            symbol: stock.symbol,
            name: stock.description,
            price: quoteData.c || 0,
            change: quoteData.d || 0,
            changePercent: quoteData.dp || 0,
            volume: 0,
            marketCap: 0,
            exchange: stock.mic,
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out nulls and apply basic filters
    const validQuotes = quotes.filter((q): q is ScreenerStock => {
      if (!q) return false;
      if (filters.minPrice && q.price < filters.minPrice) return false;
      if (filters.maxPrice && q.price > filters.maxPrice) return false;
      return true;
    });

    return validQuotes;
  } catch (error) {
    console.error("Finnhub screener error:", error);
    return [];
  }
}
