# Mock Data Implementation

All API endpoints now have mock data fallbacks to ensure the application always returns meaningful data, even when:
- API rate limits are exceeded
- API keys are missing or invalid
- Network errors occur
- External services are down

## Implementation Pattern

Every endpoint follows this error handling pattern:

```typescript
try {
  // Try fetching from real APIs (Alpha Vantage, FMP, Finnhub, News API)
  
  if (apiDataAvailable) {
    return NextResponse.json(apiData);
  }
  
  // Fallback to mock data if no API data available
  return NextResponse.json(mockData);
} catch (error) {
  console.error("Error:", error);
  // Return mock data on error
  return NextResponse.json(mockData);
}
```

## Mock Data Sources

### Centralized Mock Data (`/lib/mock-data.ts`)
Contains reusable mock data for common scenarios:
- **MOCK_STOCKS**: 8 major stocks (AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META, AMD)
- **MOCK_TOP_MOVERS**: Top gainers, losers, and most actively traded stocks
- **MOCK_MARKET_INDICES**: S&P 500, Dow Jones, NASDAQ, Russell 2000
- **MOCK_NEWS**: Sample news articles with realistic content
- **MOCK_IPOS**: Recent IPO calendar data
- **MOCK_SECTORS**: Sector performance data (Technology, Healthcare, Finance, etc.)
- **MOCK_INSIDER_TRADES**: Sample insider trading transactions
- **MOCK_COMPANY_OVERVIEW**: Comprehensive company fundamental data
- **generateMockQuote(symbol)**: Dynamic quote generation with realistic prices
- **generateMockHistoricalData(symbol, days)**: Historical OHLCV data generator

### Endpoint-Specific Mock Data
Some endpoints have their own mock data constants:
- **MOCK_DIVIDENDS** (dividends endpoint)
- **MOCK_SPLITS** (splits endpoint)
- **MOCK_INCOME_STATEMENT** (income-statement endpoint)
- **MOCK_BALANCE_SHEET** (balance-sheet endpoint)
- **MOCK_CASH_FLOW** (cash-flow endpoint)
- **MOCK_RECOMMENDATIONS** (recommendations endpoint)
- **MOCK_PEERS** (peers endpoint)
- **MOCK_MARKET_STATUS** (market-status endpoint)
- **MOCK_FOREX_RATES** (forex-rates endpoint)
- **MOCK_COMMODITIES** (commodities endpoint)
- **MOCK_CRYPTO** (crypto endpoint)
- **MOCK_ECONOMIC_INDICATORS** (economic-indicators endpoint)

## Updated Endpoints (27 Total)

### ✅ Market Data Endpoints
1. `/api/quote` - Real-time stock quotes (uses `generateMockQuote`)
2. `/api/historical-price` - Historical OHLCV data (uses `generateMockHistoricalData`)
3. `/api/top-gainers-losers` - Market movers (uses `MOCK_TOP_MOVERS`)
4. `/api/most-active` - Most actively traded (uses `MOCK_TOP_MOVERS.mostActivelyTraded`)
5. `/api/sector-performance` - Sector tracking (uses `MOCK_SECTORS`)
6. `/api/market-indices` - Major indices (uses `MOCK_MARKET_INDICES`)
7. `/api/market-status` - Market hours (uses `MOCK_MARKET_STATUS`)

### ✅ Company Fundamentals
8. `/api/company-overview` - 50+ fundamental metrics (uses `MOCK_COMPANY_OVERVIEW`)
9. `/api/income-statement` - P&L statements (uses `MOCK_INCOME_STATEMENT`)
10. `/api/balance-sheet` - Assets/liabilities (uses `MOCK_BALANCE_SHEET`)
11. `/api/cash-flow` - Cash flow statements (uses `MOCK_CASH_FLOW`)
12. `/api/dividends` - Dividend history (uses `MOCK_DIVIDENDS`)
13. `/api/splits` - Stock splits (uses `MOCK_SPLITS`)

### ✅ News & Sentiment
14. `/api/stock-news` - Stock-specific news (uses `MOCK_NEWS`)
15. `/api/general-news` - Market news (uses `MOCK_NEWS`)

### ✅ Analyst Data
16. `/api/recommendations` - Analyst ratings (uses `MOCK_RECOMMENDATIONS`)
17. `/api/peers` - Competitor companies (uses `MOCK_PEERS`)

### ✅ Calendar Events
18. `/api/ipo-calendar` - IPO tracking (uses `MOCK_IPOS`)

### ✅ Stock Lists
19. `/api/stock-list` - Exchange listings (uses `MOCK_STOCKS`)

### ✅ Alternative Assets
20. `/api/forex-rates` - Currency exchange (uses `MOCK_FOREX_RATES`)
21. `/api/commodities` - Oil, gold, copper prices (uses `MOCK_COMMODITIES`)
22. `/api/crypto` - BTC, ETH prices (uses `MOCK_CRYPTO`)

### ✅ Economic Data
23. `/api/economic-indicators` - GDP, CPI, unemployment (uses `MOCK_ECONOMIC_INDICATORS`)

## Benefits

1. **Development**: Developers can work without valid API keys
2. **Testing**: Consistent, predictable data for testing
3. **Production Resilience**: App never shows empty data or errors to users
4. **Demo Mode**: Can showcase features even with expired API keys
5. **Cost Savings**: Reduces unnecessary API calls during development
6. **Better UX**: Users always see meaningful data instead of error messages

## Example Usage

When an API fails, users will see realistic mock data instead of errors:

```json
// Quote endpoint with mock data
{
  "c": 178.45,  // current price
  "h": 182.30,  // high
  "l": 176.80,  // low
  "o": 179.20,  // open
  "pc": 177.50, // previous close
  "t": 1704067200
}
```

## Future Enhancements

Consider adding:
- Configuration flag to force mock data mode
- Mock data randomization for more realistic testing
- User notification when mock data is being used
- Mock data versioning for different test scenarios
- Admin panel to switch between real and mock data
