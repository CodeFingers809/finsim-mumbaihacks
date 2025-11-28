# Quick Reference: All API Endpoints with Mock Data

## ✅ Complete - All 27 Endpoints Have Mock Data Fallbacks

### Market Data (7 endpoints)
- ✅ `/api/quote?symbol=AAPL` - Real-time quotes
- ✅ `/api/historical-price?symbol=AAPL` - Historical OHLCV data
- ✅ `/api/top-gainers-losers` - Top gainers, losers, active stocks
- ✅ `/api/most-active` - Most actively traded
- ✅ `/api/sector-performance` - Sector tracking
- ✅ `/api/market-indices` - S&P, Dow, NASDAQ, Russell
- ✅ `/api/market-status` - Market open/close status

### Company Fundamentals (6 endpoints)
- ✅ `/api/company-overview?symbol=AAPL` - 50+ metrics (P/E, EPS, etc.)
- ✅ `/api/income-statement?symbol=AAPL` - P&L statements
- ✅ `/api/balance-sheet?symbol=AAPL` - Assets/liabilities
- ✅ `/api/cash-flow?symbol=AAPL` - Cash flow statements
- ✅ `/api/dividends?symbol=AAPL` - Dividend history
- ✅ `/api/splits?symbol=AAPL` - Stock splits

### News & Sentiment (2 endpoints)
- ✅ `/api/stock-news?symbol=AAPL` - Stock-specific news
- ✅ `/api/general-news` - Market news

### Analyst Data (2 endpoints)
- ✅ `/api/recommendations?symbol=AAPL` - Analyst ratings
- ✅ `/api/peers?symbol=AAPL` - Competitor companies

### Calendar & Events (1 endpoint)
- ✅ `/api/ipo-calendar` - Upcoming IPOs

### Stock Lists (1 endpoint)
- ✅ `/api/stock-list?exchange=NYSE` - Exchange listings

### Alternative Assets (3 endpoints)
- ✅ `/api/forex-rates?from=USD&to=EUR` - Currency exchange
- ✅ `/api/commodities?commodity=WTI` - Oil, gold, copper
- ✅ `/api/crypto?symbol=BTCUSD` - Bitcoin, Ethereum

### Economic Data (1 endpoint)
- ✅ `/api/economic-indicators?indicator=GDP` - GDP, CPI, unemployment

### Already Existing (4 endpoints - not modified)
- `/api/backtest` - Strategy backtesting
- `/api/company` - Company search
- `/api/earnings` - Earnings calendar
- `/api/insider-trading` - Insider transactions
- `/api/movers` - Market movers (original)
- `/api/news` - News feed (original)
- `/api/orders` - Trading orders
- `/api/positions` - Portfolio positions
- `/api/screener` - Stock screener
- `/api/stocks` - Stock data (original)
- `/api/strategies` - Strategy management
- `/api/technicals` - Technical indicators
- `/api/watchlist` - Watchlist management

## Testing Examples

```bash
# Test quote with mock data
curl http://localhost:3000/api/quote?symbol=AAPL

# Test historical data
curl http://localhost:3000/api/historical-price?symbol=AAPL

# Test market movers
curl http://localhost:3000/api/top-gainers-losers

# Test company fundamentals
curl http://localhost:3000/api/company-overview?symbol=AAPL

# Test news
curl http://localhost:3000/api/stock-news?symbol=AAPL

# Test forex
curl "http://localhost:3000/api/forex-rates?from=USD&to=EUR"

# Test commodities
curl http://localhost:3000/api/commodities?commodity=WTI

# Test crypto
curl http://localhost:3000/api/crypto?symbol=BTCUSD
```

## Mock Data Features

**Always returns data** - No empty arrays or error messages
**Realistic values** - Market-accurate prices and metrics
**Dynamic generation** - Historical data generated on-the-fly
**Symbol-aware** - Returns appropriate data for each stock symbol
**Time-aware** - Includes current timestamps
**Production-ready** - Graceful degradation when APIs fail

## API Key Setup (Optional)

If you want real data instead of mocks, add these to `.env.local`:

```bash
ALPHA_VANTAGE_API_KEY=your_key_here  # 25 requests/day
FMP_API_KEY=your_key_here             # 250 requests/day
FINNHUB_API_KEY=your_key_here         # 60 requests/minute
NEWS_API_KEY=your_key_here            # 100 requests/day
```

Without API keys, all endpoints will automatically return mock data.
