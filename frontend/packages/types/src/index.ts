export type WatchlistStock = {
    symbol: string;
    addedAt: string;
};

export type Watchlist = {
    _id: string;
    userId: string;
    name: string;
    stocks: WatchlistStock[];
    createdAt: string;
    updatedAt: string;
};

export type StrategyLegAction = "buy" | "sell";
export type StrategyLegType = "equity" | "option";
export type OrderType = "market" | "limit";

export type StrategyLeg = {
    type: StrategyLegType;
    action: StrategyLegAction;
    symbol: string;
    strike?: number;
    expiry?: string;
    quantity: number;
    orderType: OrderType;
    limitPrice?: number;
};

export type Strategy = {
    _id: string;
    userId: string;
    name: string;
    description?: string;
    legs: StrategyLeg[];
    createdAt: string;
};

export type Position = {
    _id: string;
    userId: string;
    strategyId?: string;
    symbol: string;
    type: StrategyLegType;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    openedAt: string;
};

export type BacktestChartSeriesPoint = {
    date: string;
    value: number;
};

export type BacktestChartData = {
    pnlBySymbol: { symbol: string; value: number }[];
    strategyVsBuyHold: { symbol: string; strategy: number; buyHold: number }[];
    equityCurves: { symbol: string; points: BacktestChartSeriesPoint[] }[];
};

// Backend response types
export type TradeMetrics = {
    symbol: string;
    strategy_return_pct: number;
    buy_hold_return_pct: number;
    alpha_pct: number;
    sharpe_ratio: number;
    win_rate_pct: number;
    max_drawdown_pct: number;
    num_trades: number;
    profit_factor: number;
    pnl: number;
    is_profitable: boolean;
};

export type PortfolioMetrics = {
    total_pnl: number;
    portfolio_return_pct: number;
    avg_sharpe_ratio: number;
    avg_win_rate_pct: number;
    avg_max_drawdown_pct: number;
    total_trades: number;
    profitable_tickers: number;
    total_tickers: number;
    robustness_score: number;
};

export type EquityPoint = {
    date: string;
    equity: number;
};

export type Analysis = {
    verification: string;
    recommendations: string;
};

export type BacktestResponse = {
    strategy_code: string;
    portfolio_metrics: PortfolioMetrics;
    ticker_results: TradeMetrics[];
    equity_curve: EquityPoint[];
    analysis: Analysis;
    errors: string[];
};

// Legacy type for backwards compatibility
export type BacktestResult = {
    _id: string;
    userId: string;
    strategy: string;
    stocks: string[];
    parameters: Record<string, unknown>;
    createdAt: string;
    initialCapital: number;
    finalBalance: number;
    totalPnL: number;
    portfolioReturn: number;
    avgStrategyReturn: number;
    avgBuyHoldReturn: number;
    sharpeRatio: number;
    avgWinRate: number;
    totalTrades: number;
    profitableAssets: number;
    chartData: BacktestChartData;
};

export type MarketQuote = {
    symbol: string;
    lastPrice: number;
    change: number;
    changePercent: number;
    dayHigh: number;
    dayLow: number;
    open: number;
    volume: number;
    previousClose: number;
};

