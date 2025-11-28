import { NextRequest, NextResponse } from "next/server";

const MOCK_COMMODITIES: Record<string, any> = {
  WTI: { name: "Crude Oil WTI", price: 78.45, unit: "USD/barrel", change: "+1.2%" },
  BRENT: { name: "Brent Crude", price: 82.67, unit: "USD/barrel", change: "+0.8%" },
  NATURAL_GAS: { name: "Natural Gas", price: 2.89, unit: "USD/MMBtu", change: "-2.1%" },
  GOLD: { name: "Gold", price: 2043.50, unit: "USD/oz", change: "+0.5%" },
  SILVER: { name: "Silver", price: 24.12, unit: "USD/oz", change: "+1.1%" },
  COPPER: { name: "Copper", price: 3.85, unit: "USD/lb", change: "+0.3%" },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const commodity = searchParams.get("commodity") || "WTI"; // WTI, BRENT, NATURAL_GAS, COPPER, ALUMINUM, WHEAT, CORN, COTTON, SUGAR, COFFEE

  try {
    // Alpha Vantage Commodities (FREE)
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_API_KEY) {
      const url = `https://www.alphavantage.co/query?function=${commodity}&interval=monthly&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data) {
          return NextResponse.json({
            commodity,
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
    return NextResponse.json({ commodity, ...MOCK_COMMODITIES[commodity] });
  } catch (error) {
    console.error("Error fetching commodity prices:", error);
    // Return mock data on error
    return NextResponse.json({ commodity, ...MOCK_COMMODITIES[commodity] });
  }
}
