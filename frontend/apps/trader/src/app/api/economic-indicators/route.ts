import { NextRequest, NextResponse } from "next/server";

const MOCK_ECONOMIC_INDICATORS: Record<string, any> = {
  GDP: { name: "Real GDP", value: "2.5%", unit: "Annual Growth Rate", date: "2023-Q4" },
  INFLATION: { name: "CPI", value: "3.4%", unit: "Year-over-Year", date: "2024-01" },
  UNEMPLOYMENT: { name: "Unemployment Rate", value: "3.7%", unit: "Percentage", date: "2024-01" },
  INTEREST_RATE: { name: "Federal Funds Rate", value: "5.5%", unit: "Percentage", date: "2024-01" },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const indicator = searchParams.get("indicator") || "REAL_GDP"; 
  // Available: REAL_GDP, REAL_GDP_PER_CAPITA, TREASURY_YIELD, FEDERAL_FUNDS_RATE, CPI, INFLATION, RETAIL_SALES, DURABLES, UNEMPLOYMENT, NONFARM_PAYROLL

  try {
    // Alpha Vantage Economic Indicators (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      let url = `https://www.alphavantage.co/query?function=${indicator}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      // Add interval parameter for indicators that support it
      if (["TREASURY_YIELD", "FEDERAL_FUNDS_RATE", "CPI", "RETAIL_SALES", "NONFARM_PAYROLL"].includes(indicator)) {
        url += "&interval=monthly";
      }
      
      const response = await fetch(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data) {
          return NextResponse.json({
            indicator,
            name: data.name,
            interval: data.interval,
            unit: data.unit,
            data: data.data.map((item: any) => ({
              date: item.date,
              value: parseFloat(item.value),
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ indicator, ...MOCK_ECONOMIC_INDICATORS[indicator] });
  } catch (error) {
    console.error("Error fetching economic indicators:", error);
    // Return mock data on error
    return NextResponse.json({ indicator, ...MOCK_ECONOMIC_INDICATORS[indicator] });
  }
}
