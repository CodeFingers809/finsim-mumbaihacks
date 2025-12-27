// Mock data for fallback when APIs are unavailable

export const MOCK_NEWS = [
    {
        symbol: "INFY",
        publishedDate: "2024-12-20T10:30:00.000Z",
        title: "Infosys announces new AI and automation services",
        image: "https://via.placeholder.com/400x300?text=Infosys+News",
        site: "Economic Times",
        text: "Infosys unveiled groundbreaking AI capabilities to help enterprises digitally transform.",
        url: "https://example.com/article1",
    },
    {
        symbol: "TCS",
        publishedDate: "2024-12-19T14:20:00.000Z",
        title: "TCS wins major banking contract in Europe",
        image: "https://via.placeholder.com/400x300?text=TCS",
        site: "Business Standard",
        text: "Tata Consultancy Services has secured a significant deal with European banks.",
        url: "https://example.com/article2",
    },
    {
        symbol: "RELIANCE",
        publishedDate: "2024-12-20T09:15:00.000Z",
        title: "Reliance Jio expands 5G network across India",
        image: "https://via.placeholder.com/400x300?text=Reliance",
        site: "Mint",
        text: "Reliance Jio continues aggressive 5G rollout with new tower installations.",
        url: "https://example.com/article3",
    },
    {
        symbol: "HDFCBANK",
        publishedDate: "2024-12-18T16:45:00.000Z",
        title: "HDFC Bank reports strong quarterly results",
        image: "https://via.placeholder.com/400x300?text=HDFC",
        site: "Moneycontrol",
        text: "The private sector bank continues to show robust growth in lending.",
        url: "https://example.com/article4",
    },
    {
        symbol: "TATAMOTORS",
        publishedDate: "2024-12-17T11:30:00.000Z",
        title: "Tata Motors launches new EV lineup",
        image: "https://via.placeholder.com/400x300?text=Tata",
        site: "Auto India",
        text: "New electric vehicle models announced for the Indian market.",
        url: "https://example.com/article5",
    },
];

export const MOCK_COMPANY_OVERVIEW = {
    Symbol: "INFY",
    AssetType: "Common Stock",
    Name: "Infosys Limited",
    Description:
        "Infosys Limited is a global leader in next-generation digital services and consulting. It provides IT services, software engineering, and consulting to enterprises worldwide.",
    CIK: "1067491",
    Exchange: "NSE",
    Currency: "INR",
    Country: "India",
    Sector: "Technology",
    Industry: "IT Services",
    Address: "Electronics City, Hosur Road, Bangalore, Karnataka, India",
    FiscalYearEnd: "September",
    LatestQuarter: "2024-09-30",
    MarketCapitalization: "3500000000000",
    EBITDA: "131000000000",
    PERatio: "33.5",
    PEGRatio: "2.8",
    BookValue: "4.25",
    DividendPerShare: "0.96",
    DividendYield: "0.0045",
    EPS: "6.42",
    RevenuePerShareTTM: "25.8",
    ProfitMargin: "0.249",
    OperatingMarginTTM: "0.308",
    ReturnOnAssetsTTM: "0.225",
    ReturnOnEquityTTM: "1.565",
    RevenueTTM: "394328000000",
    GrossProfitTTM: "183365000000",
    DilutedEPSTTM: "6.42",
    QuarterlyEarningsGrowthYOY: "0.11",
    QuarterlyRevenueGrowthYOY: "0.06",
    AnalystTargetPrice: "225.5",
    TrailingPE: "33.5",
    ForwardPE: "28.2",
    PriceToSalesRatioTTM: "8.9",
    PriceToBookRatio: "50.5",
    EVToRevenue: "8.8",
    EVToEBITDA: "26.7",
    Beta: "1.24",
    "52WeekHigh": "237.23",
    "52WeekLow": "164.08",
    "50DayMovingAverage": "226.45",
    "200DayMovingAverage": "208.32",
    SharesOutstanding: "15441000000",
    DividendDate: "2024-11-14",
    ExDividendDate: "2024-11-10",
};

export const MOCK_MARKET_INDICES = [
    {
        symbol: "^NSEI",
        name: "NIFTY 50",
        price: 25884.80,
        changesPercentage: -0.29,
        change: -74.70,
        dayLow: 25750.25,
        dayHigh: 25920.15,
        yearHigh: 26277.35,
        yearLow: 21281.45,
        marketCap: null,
        priceAvg50: 25456.78,
        priceAvg200: 24123.90,
        volume: 324567890,
        avgVolume: 350000000,
    },
    {
        symbol: "^BSESN",
        name: "SENSEX",
        price: 84587.01,
        changesPercentage: -0.37,
        change: -313.73,
        dayLow: 84250.30,
        dayHigh: 84720.50,
        yearHigh: 85978.25,
        yearLow: 70001.55,
        marketCap: null,
        priceAvg50: 83892.45,
        priceAvg200: 79678.23,
        volume: 287654321,
        avgVolume: 300000000,
    },
    {
        symbol: "^NSEBANK",
        name: "NIFTY Bank",
        price: 54213.45,
        changesPercentage: -0.52,
        change: -283.25,
        dayLow: 53980.20,
        dayHigh: 54350.80,
        yearHigh: 55487.90,
        yearLow: 45123.65,
        marketCap: null,
        priceAvg50: 53789.12,
        priceAvg200: 51234.78,
        volume: 123456789,
        avgVolume: 150000000,
    },
    {
        symbol: "^CNXIT",
        name: "NIFTY IT",
        price: 43567.25,
        changesPercentage: 0.85,
        change: 367.45,
        dayLow: 43125.60,
        dayHigh: 43620.90,
        yearHigh: 44892.30,
        yearLow: 32456.70,
        marketCap: null,
        priceAvg50: 42889.55,
        priceAvg200: 40567.85,
        volume: 98765432,
        avgVolume: 100000000,
    },
];

export const MOCK_SECTORS = [
    { name: "Technology", performance: "2.45%" },
    { name: "Healthcare", performance: "1.32%" },
    { name: "Financial Services", performance: "0.87%" },
    { name: "Consumer Cyclical", performance: "1.65%" },
    { name: "Industrials", performance: "0.54%" },
    { name: "Energy", performance: "-0.23%" },
    { name: "Utilities", performance: "0.12%" },
    { name: "Real Estate", performance: "-0.45%" },
    { name: "Basic Materials", performance: "0.76%" },
    { name: "Consumer Defensive", performance: "0.34%" },
    { name: "Communication Services", performance: "1.89%" },
];

export const MOCK_TOP_MOVERS = [
    {
        symbol: "INFY",
        name: "Infosys Limited",
        price: 1895.50,
        change: 87.25,
        changesPercentage: 4.83,
        volume: 12345678,
    },
    {
        symbol: "TCS",
        name: "Tata Consultancy Services Limited",
        price: 4125.30,
        change: 172.80,
        changesPercentage: 4.37,
        volume: 8901234,
    },
    {
        symbol: "RELIANCE",
        name: "Reliance Industries Limited",
        price: 2847.65,
        change: 115.35,
        changesPercentage: 4.22,
        volume: 23456789,
    },
    {
        symbol: "HDFCBANK",
        name: "HDFC Bank Limited",
        price: 1678.90,
        change: -62.45,
        changesPercentage: -3.59,
        volume: 15678901,
    },
    {
        symbol: "ICICIBANK",
        name: "ICICI Bank Limited",
        price: 1245.20,
        change: -45.30,
        changesPercentage: -3.51,
        volume: 9876543,
    },
];

export const MOCK_IPOS = [
    {
        symbol: "GODIGIT",
        name: "Go Digit General Insurance",
        date: "2025-01-15",
        priceRange: "₹280-₹300",
        shares: "25000000",
        status: "upcoming",
    },
    {
        symbol: "OLAELEC",
        name: "Ola Electric Mobility",
        date: "2025-01-22",
        priceRange: "₹72-₹76",
        shares: "84000000",
        status: "upcoming",
    },
    {
        symbol: "BHARATLOGIS",
        name: "Bharat Logistics",
        date: "2024-12-15",
        priceRange: "₹465-₹485",
        shares: "35000000",
        status: "priced",
        openPrice: "₹478",
    },
];

export const MOCK_STOCKS = [
    { symbol: "INFY", name: "Infosys Limited", exchange: "NSE" },
    { symbol: "TCS", name: "Tata Consultancy Services Limited", exchange: "NSE" },
    { symbol: "RELIANCE", name: "Reliance Industries Limited", exchange: "NSE" },
    { symbol: "HDFCBANK", name: "HDFC Bank Limited", exchange: "NSE" },
    { symbol: "ICICIBANK", name: "ICICI Bank Limited", exchange: "NSE" },
    { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", exchange: "NSE" },
    { symbol: "ITC", name: "ITC Limited", exchange: "NSE" },
    { symbol: "WIPRO", name: "Wipro Limited", exchange: "NSE" },
    { symbol: "TATAMOTORS", name: "Tata Motors Limited", exchange: "BSE" },
];

export function generateMockQuote(symbol: string) {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 10;
    const changesPercentage = (change / basePrice) * 100;

    return {
        symbol: symbol.toUpperCase(),
        name: `${symbol} Company`,
        price: parseFloat(basePrice.toFixed(2)),
        changesPercentage: parseFloat(changesPercentage.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        dayLow: parseFloat((basePrice - Math.random() * 5).toFixed(2)),
        dayHigh: parseFloat((basePrice + Math.random() * 5).toFixed(2)),
        yearHigh: parseFloat((basePrice * 1.3).toFixed(2)),
        yearLow: parseFloat((basePrice * 0.7).toFixed(2)),
        marketCap: Math.floor(basePrice * 1000000000),
        priceAvg50: parseFloat((basePrice * 0.98).toFixed(2)),
        priceAvg200: parseFloat((basePrice * 0.95).toFixed(2)),
        volume: Math.floor(1000000 + Math.random() * 10000000),
        avgVolume: Math.floor(1500000 + Math.random() * 8000000),
        open: parseFloat((basePrice - change).toFixed(2)),
        previousClose: parseFloat((basePrice - change).toFixed(2)),
        eps: parseFloat((Math.random() * 10).toFixed(2)),
        pe: parseFloat((15 + Math.random() * 20).toFixed(2)),
        earningsAnnouncement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        sharesOutstanding: Math.floor(basePrice * 10000000),
        timestamp: Date.now(),
    };
}

export function generateMockHistoricalData(symbol: string, days: number = 365) {
    const basePrice = 100 + Math.random() * 400;
    const data = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const trendFactor = (days - i) / days;
        const variance = (Math.random() - 0.5) * 15;
        const priceBase = basePrice * (1 + trendFactor * 0.2);
        const open = priceBase + variance;
        const close = open + (Math.random() - 0.5) * 8;
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        const volume = Math.floor(500000 + Math.random() * 3000000);

        data.push({
            date: dateStr,
            time: dateStr,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume,
        });
    }

    return data;
}

