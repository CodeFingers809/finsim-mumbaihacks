import { NextRequest, NextResponse } from "next/server";

interface CompanyProfile {
  symbol: string;
  companyName: string;
  description: string;
  industry: string;
  sector: string;
  ceo: string;
  website: string;
  employees: number;
  marketCap: number;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  image: string;
  ipoDate: string;
  exchange: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Try FMP first (most comprehensive company data)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      try {
        const profile = await fetchFromFMP(symbol, FMP_API_KEY);
        if (profile) {
          return NextResponse.json(profile);
        }
      } catch (error) {
        console.error("FMP profile error:", error);
      }
    }

    // Fallback to Finnhub
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    if (FINNHUB_API_KEY) {
      try {
        const profile = await fetchFromFinnhub(symbol, FINNHUB_API_KEY);
        if (profile) {
          return NextResponse.json(profile);
        }
      } catch (error) {
        console.error("Finnhub profile error:", error);
      }
    }

    // Fallback to Alpha Vantage
    const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_KEY) {
      try {
        const profile = await fetchFromAlphaVantage(symbol, ALPHA_VANTAGE_KEY);
        if (profile) {
          return NextResponse.json(profile);
        }
      } catch (error) {
        console.error("Alpha Vantage profile error:", error);
      }
    }

    return NextResponse.json(
      { error: "Company profile not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}

async function fetchFromFMP(symbol: string, apiKey: string): Promise<CompanyProfile | null> {
  try {
    const url = `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const company = data[0];
      return {
        symbol: company.symbol,
        companyName: company.companyName || company.name || symbol,
        description: company.description || "No description available",
        industry: company.industry || "Unknown",
        sector: company.sector || "Unknown",
        ceo: company.ceo || "N/A",
        website: company.website || "",
        employees: company.fullTimeEmployees || 0,
        marketCap: company.mktCap || 0,
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        country: company.country || "",
        phone: company.phone || "",
        image: company.image || "",
        ipoDate: company.ipoDate || "",
        exchange: company.exchangeShortName || company.exchange || "",
      };
    }

    return null;
  } catch (error) {
    console.error(`FMP profile error for ${symbol}:`, error);
    return null;
  }
}

async function fetchFromFinnhub(symbol: string, apiKey: string): Promise<CompanyProfile | null> {
  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.name) {
      return {
        symbol: data.ticker || symbol,
        companyName: data.name,
        description: data.description || "No description available",
        industry: data.finnhubIndustry || "Unknown",
        sector: "Unknown",
        ceo: "N/A",
        website: data.weburl || "",
        employees: 0,
        marketCap: data.marketCapitalization ? data.marketCapitalization * 1000000 : 0,
        address: "",
        city: "",
        state: data.state || "",
        country: data.country || "",
        phone: data.phone || "",
        image: data.logo || "",
        ipoDate: data.ipo || "",
        exchange: data.exchange || "",
      };
    }

    return null;
  } catch (error) {
    console.error(`Finnhub profile error for ${symbol}:`, error);
    return null;
  }
}

async function fetchFromAlphaVantage(symbol: string, apiKey: string): Promise<CompanyProfile | null> {
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.Symbol) {
      return {
        symbol: data.Symbol,
        companyName: data.Name || symbol,
        description: data.Description || "No description available",
        industry: data.Industry || "Unknown",
        sector: data.Sector || "Unknown",
        ceo: "N/A",
        website: "N/A",
        employees: 0,
        marketCap: parseInt(data.MarketCapitalization || "0"),
        address: data.Address || "",
        city: "",
        state: "",
        country: data.Country || "",
        phone: "",
        image: "",
        ipoDate: "",
        exchange: data.Exchange || "",
      };
    }

    return null;
  } catch (error) {
    console.error(`Alpha Vantage profile error for ${symbol}:`, error);
    return null;
  }
}
