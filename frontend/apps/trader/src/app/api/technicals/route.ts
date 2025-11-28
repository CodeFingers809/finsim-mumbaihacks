import { NextRequest, NextResponse } from "next/server";

interface TechnicalIndicators {
  symbol: string;
  timestamp: string;
  rsi: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  sma: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
  };
  ema: {
    ema12: number | null;
    ema26: number | null;
    ema50: number | null;
  };
  bollingerBands: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  atr: number | null;
  adx: number | null;
  stochastic: {
    k: number | null;
    d: number | null;
  } | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") || "daily"; // daily, weekly, monthly

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  try {
    // Try Alpha Vantage first (best for technical indicators)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      try {
        const indicators = await fetchFromAlphaVantage(symbol, ALPHA_VANTAGE_API_KEY, interval);
        if (indicators) {
          return NextResponse.json(indicators);
        }
      } catch (error) {
        console.error("Alpha Vantage technical indicators error:", error);
      }
    }

    // FMP fallback
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      try {
        const indicators = await fetchFromFMP(symbol, FMP_API_KEY, interval);
        if (indicators) {
          return NextResponse.json(indicators);
        }
      } catch (error) {
        console.error("FMP technical indicators error:", error);
      }
    }

    return NextResponse.json({
      symbol,
      timestamp: new Date().toISOString(),
      rsi: null,
      macd: { macd: null, signal: null, histogram: null },
      sma: { sma20: null, sma50: null, sma200: null },
      ema: { ema12: null, ema26: null, ema50: null },
      bollingerBands: { upper: null, middle: null, lower: null },
      atr: null,
      adx: null,
      stochastic: null,
    });
  } catch (error) {
    console.error("Error fetching technical indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch technical indicators" },
      { status: 500 }
    );
  }
}

async function fetchFromAlphaVantage(
  symbol: string,
  apiKey: string,
  interval: string
): Promise<TechnicalIndicators | null> {
  try {
    const intervalMap: Record<string, string> = {
      daily: "daily",
      weekly: "weekly",
      monthly: "monthly",
    };
    const avInterval = intervalMap[interval] || "daily";

    // Fetch multiple indicators in parallel
    const [rsiData, macdData, smaData, emaData, bbandData, atrData, adxData, stochData] = await Promise.all([
      fetchIndicator("RSI", symbol, apiKey, avInterval, { time_period: "14" }),
      fetchIndicator("MACD", symbol, apiKey, avInterval, {}),
      fetchIndicator("SMA", symbol, apiKey, avInterval, { time_period: "20" }),
      fetchIndicator("EMA", symbol, apiKey, avInterval, { time_period: "12" }),
      fetchIndicator("BBANDS", symbol, apiKey, avInterval, { time_period: "20" }),
      fetchIndicator("ATR", symbol, apiKey, avInterval, { time_period: "14" }),
      fetchIndicator("ADX", symbol, apiKey, avInterval, { time_period: "14" }),
      fetchIndicator("STOCH", symbol, apiKey, avInterval, {}),
    ]);

    // Also fetch SMA50 and SMA200
    const [sma50Data, sma200Data, ema26Data, ema50Data] = await Promise.all([
      fetchIndicator("SMA", symbol, apiKey, avInterval, { time_period: "50" }),
      fetchIndicator("SMA", symbol, apiKey, avInterval, { time_period: "200" }),
      fetchIndicator("EMA", symbol, apiKey, avInterval, { time_period: "26" }),
      fetchIndicator("EMA", symbol, apiKey, avInterval, { time_period: "50" }),
    ]);

    // Extract latest values
    const getLatestValue = (data: any, key: string): number | null => {
      if (!data) return null;
      const technical = data[`Technical Analysis: ${key}`];
      if (!technical) return null;
      const dates = Object.keys(technical);
      if (dates.length === 0) return null;
      const latestDate = dates[0];
      return parseFloat(technical[latestDate][key]) || null;
    };

    const getLatestMACDValue = (data: any, key: string): number | null => {
      if (!data) return null;
      const technical = data["Technical Analysis: MACD"];
      if (!technical) return null;
      const dates = Object.keys(technical);
      if (dates.length === 0) return null;
      const latestDate = dates[0];
      return parseFloat(technical[latestDate][key]) || null;
    };

    const getLatestBBandValue = (data: any, band: string): number | null => {
      if (!data) return null;
      const technical = data["Technical Analysis: BBANDS"];
      if (!technical) return null;
      const dates = Object.keys(technical);
      if (dates.length === 0) return null;
      const latestDate = dates[0];
      return parseFloat(technical[latestDate][`Real ${band} Band`]) || null;
    };

    const getLatestStochValue = (data: any, key: string): number | null => {
      if (!data) return null;
      const technical = data["Technical Analysis: STOCH"];
      if (!technical) return null;
      const dates = Object.keys(technical);
      if (dates.length === 0) return null;
      const latestDate = dates[0];
      return parseFloat(technical[latestDate][key]) || null;
    };

    return {
      symbol,
      timestamp: new Date().toISOString(),
      rsi: getLatestValue(rsiData, "RSI"),
      macd: {
        macd: getLatestMACDValue(macdData, "MACD"),
        signal: getLatestMACDValue(macdData, "MACD_Signal"),
        histogram: getLatestMACDValue(macdData, "MACD_Hist"),
      },
      sma: {
        sma20: getLatestValue(smaData, "SMA"),
        sma50: getLatestValue(sma50Data, "SMA"),
        sma200: getLatestValue(sma200Data, "SMA"),
      },
      ema: {
        ema12: getLatestValue(emaData, "EMA"),
        ema26: getLatestValue(ema26Data, "EMA"),
        ema50: getLatestValue(ema50Data, "EMA"),
      },
      bollingerBands: {
        upper: getLatestBBandValue(bbandData, "Upper"),
        middle: getLatestBBandValue(bbandData, "Middle"),
        lower: getLatestBBandValue(bbandData, "Lower"),
      },
      atr: getLatestValue(atrData, "ATR"),
      adx: getLatestValue(adxData, "ADX"),
      stochastic: {
        k: getLatestStochValue(stochData, "SlowK"),
        d: getLatestStochValue(stochData, "SlowD"),
      },
    };
  } catch (error) {
    console.error("Alpha Vantage technical indicators error:", error);
    return null;
  }
}

async function fetchIndicator(
  indicator: string,
  symbol: string,
  apiKey: string,
  interval: string,
  params: Record<string, string>
): Promise<any> {
  try {
    const baseUrl = "https://www.alphavantage.co/query";
    const urlParams = new URLSearchParams({
      function: indicator,
      symbol,
      interval,
      apikey: apiKey,
      ...params,
    });

    const response = await fetch(`${baseUrl}?${urlParams.toString()}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchFromFMP(
  symbol: string,
  apiKey: string,
  interval: string
): Promise<TechnicalIndicators | null> {
  try {
    // FMP has technical indicators endpoint
    const periodMap: Record<string, string> = {
      daily: "1day",
      weekly: "1week",
      monthly: "1month",
    };
    const period = periodMap[interval] || "1day";

    const url = `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=${symbol}&periodLength=14&timeframe=${period}&apikey=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) return null;

    const latest = data[0];

    return {
      symbol,
      timestamp: new Date().toISOString(),
      rsi: latest.rsi ? parseFloat(latest.rsi) : null,
      macd: {
        macd: null,
        signal: null,
        histogram: null,
      },
      sma: {
        sma20: null,
        sma50: null,
        sma200: null,
      },
      ema: {
        ema12: null,
        ema26: null,
        ema50: null,
      },
      bollingerBands: {
        upper: null,
        middle: null,
        lower: null,
      },
      atr: null,
      adx: null,
      stochastic: null,
    };
  } catch (error) {
    console.error("FMP technical indicators error:", error);
    return null;
  }
}
