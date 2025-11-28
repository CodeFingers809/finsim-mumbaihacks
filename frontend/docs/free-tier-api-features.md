# Free-Tier API Features Documentation

All endpoints below are implemented using only FREE tier features from your API keys:
- **Alpha Vantage** (Free: 25 requests/day)
- **FMP (Financial Modeling Prep)** (Free: 250 requests/day)
- **Finnhub** (Free: 60 requests/minute)
- **News API** (Free: 100 requests/day)

---

## 📊 Stock Data & Quotes

### 1. Real-Time Quote
**Endpoint:** `/api/quote?symbol=AAPL`

Get real-time stock quotes with price, volume, and daily stats.

**Features:**
- Current price
- Day high/low, year high/low
- Volume & avg volume
- P/E ratio, EPS
- 50-day & 200-day moving averages

---

### 2. Historical Prices
**Endpoint:** `/api/historical-price?symbol=AAPL&from=2024-01-01&to=2024-12-31`

Get historical daily OHLCV data (up to 5 years free).

**Features:**
- Open, High, Low, Close, Volume
- Adjusted close prices
- VWAP (Volume Weighted Average Price)
- Change & change percent

---

### 3. Company Overview
**Endpoint:** `/api/company-overview?symbol=AAPL`

Comprehensive company fundamental data.

**Features:**
- Company description & sector
- Market cap, P/E, P/B ratios
- Profit margins, ROE, ROA
- Revenue, EPS, dividend info
- 52-week high/low
- Beta, analyst target price
- 50+ fundamental metrics

---

## 💼 Company Financials

### 4. Income Statement
**Endpoint:** `/api/income-statement?symbol=AAPL`

Annual and quarterly income statements.

**Features:**
- Revenue, gross profit
- Operating income & expenses
- Net income, EPS
- EBIT, EBITDA
- R&D, SG&A expenses
- Interest income/expense

---

### 5. Balance Sheet
**Endpoint:** `/api/balance-sheet?symbol=AAPL`

Annual and quarterly balance sheets.

**Features:**
- Total assets & liabilities
- Cash & cash equivalents
- Current & long-term debt
- Shareholder equity
- Inventory, receivables
- Property, plant & equipment
- Goodwill & intangibles

---

### 6. Cash Flow Statement
**Endpoint:** `/api/cash-flow?symbol=AAPL`

Annual and quarterly cash flow statements.

**Features:**
- Operating cash flow
- Investing cash flow
- Financing cash flow
- Capital expenditures
- Dividend payments
- Stock repurchases
- Free cash flow

---

## 📰 News & Market Insights

### 7. Stock-Specific News
**Endpoint:** `/api/stock-news?symbol=AAPL&limit=10`

Latest news articles for a specific stock.

**Features:**
- Article title, text, image
- Publication date
- Source website
- Direct article links

---

### 8. General Market News
**Endpoint:** `/api/general-news?limit=20`

Latest general market news and analysis.

**Features:**
- Market-wide news
- Multiple tickers per article
- Author & source info
- Full article content

---

## 💰 Corporate Actions

### 9. Dividends
**Endpoint:** `/api/dividends?symbol=AAPL`

Historical dividend payments.

**Features:**
- Ex-dividend date
- Payment date
- Record date
- Declaration date
- Dividend amount
- Adjusted amount

---

### 10. Stock Splits
**Endpoint:** `/api/splits?symbol=AAPL`

Historical stock split data.

**Features:**
- Split date
- Split factor (e.g., 2:1, 3:2)
- From/To factors

---

## 📅 Market Calendar

### 11. IPO Calendar
**Endpoint:** `/api/ipo-calendar?from=2024-01-01&to=2024-12-31`

Upcoming and recent IPOs.

**Features:**
- IPO date
- Company name & symbol
- Price range
- Number of shares
- Exchange
- IPO status

---

### 12. Earnings Calendar
**Endpoint:** `/api/earnings/calendar?from=2024-01-01&to=2024-12-31`

Upcoming earnings announcements.

**Features:**
- Earnings date & time
- Estimated EPS
- Fiscal period
- Company info

---

## 🌍 Global Markets

### 13. Forex Rates
**Endpoint:** `/api/forex-rates?from=USD&to=EUR`

Real-time foreign exchange rates.

**Features:**
- 150+ currency pairs
- Bid/Ask prices
- Last refreshed timestamp
- Timezone info

---

### 14. Cryptocurrency
**Endpoint:** `/api/crypto?symbol=BTC&market=USD`

Daily crypto prices (BTC, ETH, etc.).

**Features:**
- Current price & OHLC
- Volume & market cap
- 30-day history
- Multiple fiat markets

---

### 15. Commodities
**Endpoint:** `/api/commodities?commodity=WTI`

Commodity prices & historical data.

**Available Commodities:**
- WTI (Oil)
- BRENT (Oil)
- NATURAL_GAS
- COPPER
- ALUMINUM
- WHEAT
- CORN
- COTTON
- SUGAR
- COFFEE

---

## 📈 Market Analytics

### 16. Top Gainers/Losers
**Endpoint:** `/api/top-gainers-losers`

Daily market movers.

**Features:**
- Top 20 gainers
- Top 20 losers
- Most actively traded
- Price, change %, volume

---

### 17. Most Active Stocks
**Endpoint:** `/api/most-active`

Most actively traded stocks.

**Features:**
- Symbol, name, price
- Change & change %
- Real-time updates

---

### 18. Sector Performance
**Endpoint:** `/api/sector-performance`

Performance of all market sectors.

**Features:**
- 11 major sectors
- Daily performance %
- Sector rotation insights

---

### 19. Market Indices
**Endpoint:** `/api/market-indices`

Major market indices (S&P 500, Dow, NASDAQ, Russell 2000).

**Features:**
- Current price
- Daily change & %
- Day high/low, year high/low
- Previous close

---

## 🏢 Company Intelligence

### 20. Insider Trading
**Endpoint:** `/api/insider-trading?symbol=AAPL&limit=50`

Company insider transactions.

**Features:**
- Insider name & title
- Transaction type (buy/sell)
- Shares traded
- Price per share
- Filing date
- Total value

---

### 21. Analyst Recommendations
**Endpoint:** `/api/recommendations?symbol=AAPL`

Historical analyst recommendations.

**Features:**
- Strong buy/buy/hold/sell counts
- Monthly trends
- Rating changes over time

---

### 22. Company Peers
**Endpoint:** `/api/peers?symbol=AAPL`

List of peer companies in same industry.

**Features:**
- Competing companies
- Same sector stocks
- Industry comparison

---

## 📊 Technical Analysis

### 23. Technical Indicators
**Endpoint:** `/api/technicals?symbol=AAPL&indicator=RSI&interval=daily`

50+ technical indicators.

**Available Indicators:**
- SMA, EMA (Moving Averages)
- RSI (Relative Strength Index)
- MACD
- Bollinger Bands
- Stochastic
- ATR
- ADX
- And 40+ more

---

## 🌐 Market Data

### 24. Market Status
**Endpoint:** `/api/market-status`

Global market open/close status.

**Features:**
- US, European, Asian markets
- Open/closed status
- Trading hours
- Holiday information
- Current session (pre/regular/post)

---

### 25. Stock Screener
**Endpoint:** `/api/screener` (existing endpoint)

Screen stocks by criteria.

**Features:**
- Market cap filters
- P/E ratio range
- Volume filters
- Price range
- Sector/industry

---

## 📉 Economic Data

### 26. Economic Indicators
**Endpoint:** `/api/economic-indicators?indicator=REAL_GDP`

US economic indicators.

**Available Indicators:**
- REAL_GDP
- UNEMPLOYMENT
- CPI (Inflation)
- FEDERAL_FUNDS_RATE
- TREASURY_YIELD
- RETAIL_SALES
- NONFARM_PAYROLL
- DURABLES

---

## 📋 Stock Lists

### 27. Stock List by Exchange
**Endpoint:** `/api/stock-list?exchange=NYSE`

All stocks on major exchanges.

**Features:**
- NYSE, NASDAQ, AMEX
- Symbol, name, price
- Company type
- Exchange info

---

## 🔍 Search Features

### 28. Symbol Search
**Endpoint:** `/api/stocks/search?query=apple` (existing endpoint)

Search for stocks by name or symbol.

---

## Usage Limits (FREE Tier)

| API | Daily Limit | Rate Limit |
|-----|------------|------------|
| **Alpha Vantage** | 25 requests/day | 5 requests/minute |
| **FMP** | 250 requests/day | No specific limit |
| **Finnhub** | Unlimited* | 60 requests/minute |
| **News API** | 100 requests/day | No specific limit |

*Finnhub free tier has unlimited requests but 60/min rate limit

---

## Caching Strategy

All endpoints implement smart caching:
- **Real-time data** (quotes): 5 seconds
- **Market movers**: 5-10 minutes
- **News**: 5 minutes
- **Company data**: 1 hour
- **Fundamental data**: 24 hours
- **Historical data**: 24 hours

This maximizes free-tier usage while providing fresh data.

---

## Best Practices

1. **Combine endpoints** - Fetch multiple data types in parallel
2. **Use caching** - All endpoints are cached server-side
3. **Implement rate limiting** - Add exponential backoff on client side
4. **Handle errors gracefully** - All endpoints return empty arrays on failure
5. **Monitor usage** - Track API calls to stay within limits

---

## Quick Start Examples

### Get Complete Stock Overview
```typescript
// Fetch all available free data for a stock
const [quote, overview, financials, news] = await Promise.all([
  fetch('/api/quote?symbol=AAPL'),
  fetch('/api/company-overview?symbol=AAPL'),
  fetch('/api/income-statement?symbol=AAPL'),
  fetch('/api/stock-news?symbol=AAPL&limit=5')
]);
```

### Market Dashboard
```typescript
// Build a complete market dashboard
const [indices, movers, sectors, status] = await Promise.all([
  fetch('/api/market-indices'),
  fetch('/api/top-gainers-losers'),
  fetch('/api/sector-performance'),
  fetch('/api/market-status')
]);
```

### Economic Overview
```typescript
// Track key economic indicators
const indicators = ['REAL_GDP', 'UNEMPLOYMENT', 'CPI', 'FEDERAL_FUNDS_RATE'];
const data = await Promise.all(
  indicators.map(ind => fetch(`/api/economic-indicators?indicator=${ind}`))
);
```

---

## Next Steps

To integrate these features into your dashboard:

1. **Update UI components** to fetch from new endpoints
2. **Add dashboard widgets** for each data type
3. **Create visualizations** using charts
4. **Implement search** and filtering
5. **Add favorites/watchlist** integration

All features are production-ready and optimized for the free tier!
