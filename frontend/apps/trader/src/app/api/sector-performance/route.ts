import { NextRequest, NextResponse } from "next/server";
import { MOCK_SECTORS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    // FMP Sector Performance (FREE)
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const url = `https://financialmodelingprep.com/api/v3/sector-performance?apikey=${FMP_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return NextResponse.json({
            sectors: data.map((sector: any) => ({
              sector: sector.sector,
              changesPercentage: sector.changesPercentage,
            })),
          });
        }
      }
    }

    // Return mock data if no API data available
    return NextResponse.json({ sectors: MOCK_SECTORS });
  } catch (error) {
    console.error("Error fetching sector performance:", error);
    // Return mock data on error
    return NextResponse.json({ sectors: MOCK_SECTORS });
  }
}
