from flask import Blueprint, request, jsonify
import yfinance as yf
import numpy as np
import pandas as pd
import re
import os
import logging
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from backtesting import Backtest, Strategy

import google.generativeai as genai

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

backtest_bp = Blueprint("backtest", __name__)

# ----------------- Pydantic Models -----------------


class BacktestRequest(BaseModel):
    """Input model for backtest request"""

    query: str = Field(
        ..., description="Natural language description of the trading strategy"
    )
    tickers: List[str] = Field(
        ..., min_length=1, description="List of stock tickers to backtest"
    )
    period: str = Field(
        default="2y", description="Data period: 1mo, 3mo, 6mo, 1y, 2y, 5y, max"
    )
    capital: float = Field(
        default=10000, gt=0, description="Initial capital per ticker"
    )


class TradeMetrics(BaseModel):
    """Metrics for a single ticker backtest"""

    symbol: str
    strategy_return_pct: float
    buy_hold_return_pct: float
    alpha_pct: float
    sharpe_ratio: float
    win_rate_pct: float
    max_drawdown_pct: float
    num_trades: int
    profit_factor: float
    pnl: float
    is_profitable: bool


class PortfolioMetrics(BaseModel):
    """Aggregate portfolio metrics"""

    total_pnl: float
    portfolio_return_pct: float
    avg_sharpe_ratio: float
    avg_win_rate_pct: float
    avg_max_drawdown_pct: float
    total_trades: int
    profitable_tickers: int
    total_tickers: int
    robustness_score: float


class EquityPoint(BaseModel):
    """Single point on equity curve"""

    date: str
    equity: float


class Analysis(BaseModel):
    """Verifier and Recommender analysis"""

    verification: str  # What the results mean
    recommendations: str  # How to improve


class BacktestResult(BaseModel):
    """Complete backtest result"""

    strategy_code: str
    portfolio_metrics: PortfolioMetrics
    ticker_results: List[TradeMetrics]
    equity_curve: List[EquityPoint] = []  # Sampled combined equity curve
    analysis: Analysis
    errors: List[str] = []


# ----------------- Few-Shot Examples -----------------

FEW_SHOT_EXAMPLES = """
=== BACKTESTING.PY STRATEGY EXAMPLES ===

EXAMPLE 1: MACD Strategy with Signal Line Crossover
class UserStrategy(Strategy):
    def init(self):
        def ema(arr, n):
            return pd.Series(arr).ewm(span=n).mean().values
        
        def macd_line(close):
            ema12 = pd.Series(close).ewm(span=12).mean()
            ema26 = pd.Series(close).ewm(span=26).mean()
            return (ema12 - ema26).values
        
        def signal_line(close):
            macd = pd.Series(close).ewm(span=12).mean() - pd.Series(close).ewm(span=26).mean()
            return macd.ewm(span=9).mean().values
        
        self.ema50 = self.I(ema, self.data.Close, 50)
        self.macd = self.I(macd_line, self.data.Close)
        self.signal = self.I(signal_line, self.data.Close)
    
    def next(self):
        if len(self.data.Close) < 50:
            return
        
        price = self.data.Close[-1]
        
        if not self.position:
            macd_cross_up = self.macd[-1] > self.signal[-1] and self.macd[-2] <= self.signal[-2]
            above_ema = price > self.ema50[-1]
            if macd_cross_up and above_ema:
                self.buy(tp=price*1.05, sl=price*0.98)
        elif self.position:
            macd_cross_down = self.macd[-1] < self.signal[-1] and self.macd[-2] >= self.signal[-2]
            if macd_cross_down:
                self.position.close()

EXAMPLE 2: RSI Mean Reversion Strategy
class UserStrategy(Strategy):
    def init(self):
        def rsi(arr, period=14):
            delta = pd.Series(arr).diff()
            gain = delta.where(delta > 0, 0).rolling(period).mean()
            loss = -delta.where(delta < 0, 0).rolling(period).mean()
            rs = gain / loss
            return (100 - 100/(1 + rs)).fillna(50).values
        
        def sma(arr, n):
            return pd.Series(arr).rolling(n).mean().bfill().values
        
        self.rsi = self.I(rsi, self.data.Close, 14)
        self.sma200 = self.I(sma, self.data.Close, 200)
    
    def next(self):
        if len(self.data.Close) < 200:
            return
        
        price = self.data.Close[-1]
        
        if not self.position:
            if self.rsi[-1] < 30 and price > self.sma200[-1]:
                self.buy(tp=price*1.08, sl=price*0.96)
        elif self.position:
            if self.rsi[-1] > 70:
                self.position.close()

EXAMPLE 3: Bollinger Bands Breakout
class UserStrategy(Strategy):
    def init(self):
        def sma(arr, n):
            return pd.Series(arr).rolling(n).mean().values
        
        def bb_upper(arr, n=20, std_dev=2):
            s = pd.Series(arr)
            return (s.rolling(n).mean() + std_dev * s.rolling(n).std()).values
        
        def bb_lower(arr, n=20, std_dev=2):
            s = pd.Series(arr)
            return (s.rolling(n).mean() - std_dev * s.rolling(n).std()).values
        
        self.sma20 = self.I(sma, self.data.Close, 20)
        self.bb_upper = self.I(bb_upper, self.data.Close, 20, 2)
        self.bb_lower = self.I(bb_lower, self.data.Close, 20, 2)
    
    def next(self):
        if len(self.data.Close) < 30:
            return
        
        price = self.data.Close[-1]
        prev_price = self.data.Close[-2]
        
        if not self.position:
            if prev_price <= self.bb_lower[-2] and price > self.bb_lower[-1]:
                self.buy(sl=price*0.97)
        elif self.position:
            if price >= self.bb_upper[-1]:
                self.position.close()

EXAMPLE 4: EMA Crossover with Volume Confirmation
class UserStrategy(Strategy):
    def init(self):
        def ema(arr, n):
            return pd.Series(arr).ewm(span=n).mean().values
        
        def vol_sma(arr, n):
            return pd.Series(arr).rolling(n).mean().values
        
        self.ema9 = self.I(ema, self.data.Close, 9)
        self.ema21 = self.I(ema, self.data.Close, 21)
        self.vol_avg = self.I(vol_sma, self.data.Volume, 20)
    
    def next(self):
        if len(self.data.Close) < 30:
            return
        
        price = self.data.Close[-1]
        volume = self.data.Volume[-1]
        
        if not self.position:
            ema_cross_up = self.ema9[-1] > self.ema21[-1] and self.ema9[-2] <= self.ema21[-2]
            high_volume = volume > self.vol_avg[-1] * 1.5
            if ema_cross_up and high_volume:
                self.buy(tp=price*1.06, sl=price*0.97)
        elif self.position:
            ema_cross_down = self.ema9[-1] < self.ema21[-1] and self.ema9[-2] >= self.ema21[-2]
            if ema_cross_down:
                self.position.close()

EXAMPLE 5: ATR-Based Volatility Breakout
class UserStrategy(Strategy):
    def init(self):
        def atr(high, low, close, period=14):
            h = pd.Series(high)
            l = pd.Series(low)
            c = pd.Series(close)
            tr1 = h - l
            tr2 = abs(h - c.shift())
            tr3 = abs(l - c.shift())
            tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
            return tr.rolling(period).mean().values
        
        def sma(arr, n):
            return pd.Series(arr).rolling(n).mean().values
        
        self.sma20 = self.I(sma, self.data.Close, 20)
        self.atr = self.I(atr, self.data.High, self.data.Low, self.data.Close, 14)
    
    def next(self):
        if len(self.data.Close) < 50:
            return
        
        price = self.data.Close[-1]
        
        if not self.position:
            breakout = price > self.sma20[-1] and self.data.Close[-2] <= self.sma20[-2]
            if breakout:
                atr_val = self.atr[-1]
                self.buy(tp=price + 2*atr_val, sl=price - 1.5*atr_val)
        elif self.position:
            if price < self.sma20[-1]:
                self.position.close()
"""

# ----------------- LLM System Prompt -----------------

SYSTEM_PROMPT = """You are an expert quantitative trading strategist. Generate a ROBUST Python trading strategy for the backtesting.py library.

CRITICAL STRUCTURE - Follow this EXACT pattern:
```python
class UserStrategy(Strategy):
    def init(self):
        # DEFINE ALL HELPER FUNCTIONS INSIDE init()
        def sma(arr, n):
            return pd.Series(arr).rolling(n).mean().bfill().values
        
        def ema(arr, n):
            return pd.Series(arr).ewm(span=n).mean().bfill().values
        
        def rsi(arr, period=14):
            delta = pd.Series(arr).diff()
            gain = delta.where(delta > 0, 0).rolling(period).mean()
            loss = -delta.where(delta < 0, 0).rolling(period).mean()
            rs = gain / loss
            return (100 - 100/(1 + rs)).fillna(50).values
        
        # Register indicators using self.I()
        self.sma200 = self.I(sma, self.data.Close, 200)
        self.rsi = self.I(rsi, self.data.Close, 14)
    
    def next(self):
        if len(self.data.Close) < 200:
            return
        
        price = self.data.Close[-1]
        
        if not self.position:
            # Entry conditions
            if self.rsi[-1] < 30 and price > self.sma200[-1]:
                self.buy(sl=price * 0.97, tp=price * 1.06)
        elif self.position:
            # Exit conditions
            if self.rsi[-1] > 70:
                self.position.close()
```

CRITICAL RULES:
1. Output ONLY valid Python code - no markdown, no explanations
2. Class MUST be named exactly "UserStrategy" and inherit from "Strategy"
3. ALL helper functions (sma, ema, rsi, etc.) MUST be defined INSIDE the init() method
4. All indicator functions MUST return numpy arrays (use .values at the end)
5. ALWAYS add data length checks in next(): if len(self.data.Close) < N: return
6. Use self.buy() for entries and self.position.close() for exits
7. ALWAYS use stop-loss (sl=) and take-profit (tp=) in self.buy()
8. This is LONG-ONLY - no short selling

AVAILABLE DATA:
- self.data.Open, self.data.High, self.data.Low, self.data.Close, self.data.Volume

GENERATE A COMPLETE STRATEGY with all helper functions defined inside init()."""


def get_refinement_prompt(previous_code: str, results: Dict, errors: List[str]) -> str:
    """Generate prompt for strategy refinement based on results"""
    # Handle None results
    if results is None:
        results = {}

    error_section = ""
    if errors:
        error_section = f"""
EXECUTION ERRORS:
{chr(10).join(errors[:5])}

COMMON FIXES:
- Index out of bounds: Add longer data length checks
- Indicators returning NaN: Add .fillna() before .values
- Position errors: Don't access position attributes directly
"""

    return f"""PREVIOUS STRATEGY CODE:
```python
{previous_code}
```

BACKTEST RESULTS:
- Total Trades: {results.get('total_trades', 0)}
- Profitable Tickers: {results.get('profitable', 0)}/{results.get('total', 0)}
- Avg Return: {results.get('avg_return', 0):.2f}%
- Avg Sharpe: {results.get('avg_sharpe', 0):.2f}
- Avg Win Rate: {results.get('avg_win_rate', 0):.1f}%

{error_section}

ANALYSIS:
1. If 0 trades: Entry conditions are never met - relax filters or fix crossover logic
2. If negative returns: Poor signal quality - add trend filter or confirmation
3. If low win rate: Too many false signals - add volume or momentum confirmation
4. If high drawdown: Improve stop loss placement

Generate IMPROVED code addressing these issues. Output ONLY the Python code."""


# ----------------- Strategy Generation -----------------


def get_llm():
    """Initialize Gemini via Google GenAI SDK"""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=genai.GenerationConfig(
            temperature=0.1,
            max_output_tokens=4000,
        ),
    )


def generate_strategy_code(
    query: str,
    model,
    iteration: int = 1,
    previous_code: str = None,
    previous_results: Dict = None,
    errors: List[str] = None,
) -> str:
    """Generate strategy code using LLM"""

    prompt = f"""{SYSTEM_PROMPT}

USER REQUEST: "{query}"

REFERENCE EXAMPLES:
{FEW_SHOT_EXAMPLES}

Generate a complete, robust UserStrategy class that implements the user's request.
Include proper risk management with stop-loss and take-profit.
Output ONLY the Python code, no markdown formatting."""

    # Call the API with timeout
    logger.info("  Calling Gemini API...")
    response = model.generate_content(prompt, request_options={"timeout": 60})

    # Extract text from response
    code = response.text.strip()

    # Clean the response
    code = re.sub(r"```python\n?", "", code)
    code = re.sub(r"```\n?", "", code)
    code = code.strip()

    return code


def compile_strategy(code: str):
    """Compile strategy code and return the class"""
    try:
        # Remove any import statements (we provide the namespace)
        code = re.sub(r"^(?:from|import)\s+.*?\n", "", code, flags=re.MULTILINE)

        # Extract only the class definition
        lines = code.split("\n")
        class_lines = []
        in_class = False
        indent_level = None

        for line in lines:
            if "class UserStrategy" in line:
                in_class = True
                class_lines.append(line)
                # Determine base indent
                indent_level = len(line) - len(line.lstrip())
            elif in_class:
                if line.strip() == "":
                    class_lines.append(line)
                elif line.startswith(" ") or line.startswith("\t"):
                    class_lines.append(line)
                elif line.strip() and not line[0].isspace():
                    # New top-level definition, stop
                    break
                else:
                    class_lines.append(line)

        final_code = "\n".join(class_lines).strip()

        if "class UserStrategy" not in final_code:
            return None, "No UserStrategy class found in generated code"

        # Execute in controlled namespace
        namespace = {"Strategy": Strategy, "pd": pd, "np": np}
        exec(final_code, namespace)

        strategy_class = namespace.get("UserStrategy")
        if strategy_class is None:
            return None, "UserStrategy class not found after execution"

        return strategy_class, final_code

    except SyntaxError as e:
        return None, f"Syntax error: {e}"
    except Exception as e:
        return None, f"Compilation error: {e}"


# ----------------- Backtesting Engine -----------------


def fetch_data(ticker: str, period: str) -> pd.DataFrame:
    """Fetch and prepare OHLCV data for backtesting"""
    try:
        df = yf.download(ticker, period=period, progress=False, auto_adjust=True)

        if df is None or df.empty:
            return None

        # Handle MultiIndex columns
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Ensure required columns exist
        required = ["Open", "High", "Low", "Close", "Volume"]
        for col in required:
            if col not in df.columns:
                return None

        df = df[required].copy()
        df.dropna(inplace=True)

        if len(df) < 50:
            return None

        return df

    except Exception:
        return None


def run_single_backtest(
    ticker: str, strategy_class, period: str, capital: float
) -> tuple:
    """Run backtest for a single ticker"""
    try:
        df = fetch_data(ticker, period)
        if df is None:
            return None, f"No data available for {ticker}"

        bt = Backtest(df, strategy_class, cash=capital, commission=0.001)
        stats = bt.run()

        # Extract metrics
        final_equity = float(stats["Equity Final [$]"])
        pnl = final_equity - capital
        strategy_return = (final_equity / capital - 1) * 100

        # Buy and hold return
        bh_return = float(
            (df["Close"].iloc[-1] - df["Close"].iloc[0]) / df["Close"].iloc[0] * 100
        )

        # Safe metric extraction with defaults
        def safe_get(key, default=0):
            val = stats.get(key, default)
            if pd.isna(val):
                return default
            return float(val)

        num_trades = int(safe_get("# Trades"))
        win_rate = safe_get("Win Rate [%]")

        metrics = TradeMetrics(
            symbol=ticker,
            strategy_return_pct=round(strategy_return, 2),
            buy_hold_return_pct=round(bh_return, 2),
            alpha_pct=round(strategy_return - bh_return, 2),
            sharpe_ratio=round(safe_get("Sharpe Ratio"), 3),
            win_rate_pct=round(win_rate, 2),
            max_drawdown_pct=round(safe_get("Max. Drawdown [%]"), 2),
            num_trades=num_trades,
            profit_factor=round(safe_get("Profit Factor", 1), 3),
            pnl=round(pnl, 2),
            is_profitable=pnl > 0,
        )

        # Get sampled equity curve (max 50 points for charting)
        equity_curve = stats._equity_curve
        equity_data = []
        if equity_curve is not None and "Equity" in equity_curve.columns:
            eq_series = equity_curve["Equity"]
            # Sample to max 50 points
            step = max(1, len(eq_series) // 50)
            sampled = eq_series.iloc[::step]
            for date_idx, equity_val in sampled.items():
                equity_data.append(
                    {
                        "date": str(date_idx)[:10],
                        "equity": round(float(equity_val), 2),
                    }
                )

        return (metrics, equity_data), None

    except Exception as e:
        return None, f"{ticker}: {str(e)}"


def run_backtests(
    tickers: List[str], strategy_class, period: str, capital: float
) -> tuple:
    """Run backtests across all tickers"""
    results = []
    all_equity_data = []
    errors = []

    for i, ticker in enumerate(tickers, 1):
        logger.info(f"  [{i}/{len(tickers)}] Backtesting {ticker}...")
        result, error = run_single_backtest(ticker, strategy_class, period, capital)

        if result:
            metrics, equity_data = result
            results.append(metrics)
            if equity_data:
                all_equity_data.extend(equity_data)
            logger.info(
                f"    ✓ {ticker}: Return={metrics.strategy_return_pct:.2f}% | Trades={metrics.num_trades} | Sharpe={metrics.sharpe_ratio:.2f}"
            )
        elif error:
            logger.warning(f"    ✗ {ticker}: {error[:80]}")
            errors.append(error)

    # Combine equity curves - average by date
    combined_equity = []
    if all_equity_data:
        equity_by_date = {}
        for point in all_equity_data:
            date = point["date"]
            if date not in equity_by_date:
                equity_by_date[date] = []
            equity_by_date[date].append(point["equity"])

        for date in sorted(equity_by_date.keys()):
            combined_equity.append(
                {"date": date, "equity": round(sum(equity_by_date[date]), 2)}
            )

        # Sample to max 50 points
        if len(combined_equity) > 50:
            step = len(combined_equity) // 50
            combined_equity = combined_equity[::step]

    return results, combined_equity, errors


def calculate_portfolio_metrics(
    results: List[TradeMetrics], capital: float
) -> PortfolioMetrics:
    """Calculate aggregate portfolio metrics"""
    if not results:
        return PortfolioMetrics(
            total_pnl=0,
            portfolio_return_pct=0,
            avg_sharpe_ratio=0,
            avg_win_rate_pct=0,
            avg_max_drawdown_pct=0,
            total_trades=0,
            profitable_tickers=0,
            total_tickers=0,
            robustness_score=0,
        )

    total_initial = capital * len(results)
    total_pnl = sum(r.pnl for r in results)
    profitable = sum(1 for r in results if r.pnl > 0)

    # Calculate averages
    avg_sharpe = np.mean([r.sharpe_ratio for r in results])
    avg_win_rate = np.mean([r.win_rate_pct for r in results])
    avg_profit_factor = np.mean([r.profit_factor for r in results])
    avg_max_dd = np.mean([r.max_drawdown_pct for r in results])
    success_rate = profitable / len(results) * 100

    # Calculate robustness score (0-100)
    sharpe_score = min(max(avg_sharpe, 0) * 20, 25)
    winrate_score = min(avg_win_rate / 4, 25)
    pf_score = min((avg_profit_factor - 1) * 12.5, 25) if avg_profit_factor > 1 else 0
    consistency_score = success_rate / 4
    robustness = sharpe_score + winrate_score + pf_score + consistency_score

    return PortfolioMetrics(
        total_pnl=round(total_pnl, 2),
        portfolio_return_pct=round(total_pnl / total_initial * 100, 2),
        avg_sharpe_ratio=round(avg_sharpe, 3),
        avg_win_rate_pct=round(avg_win_rate, 2),
        avg_max_drawdown_pct=round(avg_max_dd, 2),
        total_trades=sum(r.num_trades for r in results),
        profitable_tickers=profitable,
        total_tickers=len(results),
        robustness_score=round(robustness, 1),
    )


def generate_analysis(
    model, results: List[TradeMetrics], portfolio: PortfolioMetrics, query: str
) -> Analysis:
    """Generate verification and recommendations using LLM"""

    # Build concise metrics summary
    metrics_summary = f"""
Strategy: {query}
Portfolio Return: {portfolio.portfolio_return_pct}%
Total P&L: ${portfolio.total_pnl}
Sharpe Ratio: {portfolio.avg_sharpe_ratio}
Win Rate: {portfolio.avg_win_rate_pct}%
Max Drawdown: {portfolio.avg_max_drawdown_pct}%
Total Trades: {portfolio.total_trades}
Profitable Tickers: {portfolio.profitable_tickers}/{portfolio.total_tickers}
Robustness Score: {portfolio.robustness_score}/100

Per-ticker results:
"""
    for r in results:
        metrics_summary += f"- {r.symbol}: {r.strategy_return_pct}% return, {r.num_trades} trades, Sharpe {r.sharpe_ratio}\n"

    # Verifier prompt
    verifier_prompt = f"""Analyze these backtest results in 2-3 sentences. Be direct and specific.
{metrics_summary}

Explain: Is this strategy profitable? What do the key metrics indicate about its quality?"""

    # Recommender prompt
    recommender_prompt = f"""Based on these backtest results, give 2-3 specific improvements in bullet points.
{metrics_summary}
DO NOT GENERATE MORE THAN 3-4 LINES.
Focus on: entry/exit timing, risk management, or indicator adjustments. Be actionable."""

    try:
        logger.info("🔍 Running Verifier agent...")
        verify_response = model.generate_content(
            verifier_prompt, request_options={"timeout": 30}
        )
        verification = verify_response.text.strip()[:500]

        logger.info("💡 Running Recommender agent...")
        recommend_response = model.generate_content(
            recommender_prompt, request_options={"timeout": 30}
        )
        recommendations = recommend_response.text.strip()[:500]

        return Analysis(verification=verification, recommendations=recommendations)
    except Exception as e:
        logger.error(f"Analysis generation failed: {e}")
        return Analysis(
            verification="Analysis unavailable due to an error.",
            recommendations="Unable to generate recommendations.",
        )


# ----------------- Flask Route -----------------


@backtest_bp.route("/backtest", methods=["POST"])
def backtest_route():
    """
    AI-powered backtesting endpoint.

    Input JSON:
    {
        "query": "Buy when RSI < 30 and price above 200 SMA, sell when RSI > 70",
        "tickers": ["AAPL", "MSFT", "GOOGL"],
        "period": "2y",
        "capital": 10000
    }

    Returns backtest results with metrics, equity curve, and AI analysis.
    """
    start_time = time.time()
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400

        # Validate input with Pydantic
        try:
            req = BacktestRequest(**data)
        except Exception as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400

        # Clean tickers
        tickers = [t.strip().upper() for t in req.tickers]
        logger.info(
            f"🚀 Starting backtest - Query: '{req.query[:50]}...' | Tickers: {tickers} | Period: {req.period}"
        )

        # Initialize LLM
        try:
            llm = get_llm()
            logger.info("✅ LLM initialized successfully")
        except ValueError as e:
            return jsonify({"error": str(e)}), 500

        # Generate strategy code
        try:
            logger.info("🤖 Generating strategy code with LLM...")
            llm_start = time.time()
            code = generate_strategy_code(req.query, llm)
            logger.info(
                f"✅ Code generated in {time.time() - llm_start:.2f}s ({len(code)} chars)"
            )
        except Exception as e:
            logger.error(f"❌ LLM error: {str(e)}")
            return jsonify({"error": f"Failed to generate strategy: {str(e)}"}), 500

        # Compile strategy
        logger.info("🔧 Compiling strategy...")
        strategy_class, compiled_code = compile_strategy(code)
        if strategy_class is None:
            logger.error(f"❌ Compilation failed: {compiled_code[:300]}...")
            return (
                jsonify(
                    {
                        "error": "Failed to compile generated strategy",
                        "details": compiled_code,
                        "generated_code": code,
                    }
                ),
                500,
            )
        logger.info("✅ Strategy compiled successfully")

        # Run backtests
        logger.info(f"📊 Running backtests on {len(tickers)} tickers...")
        bt_start = time.time()
        results, combined_equity, errors = run_backtests(
            tickers, strategy_class, req.period, req.capital
        )
        logger.info(f"✅ Backtests completed in {time.time() - bt_start:.2f}s")

        if errors:
            logger.warning(f"⚠️  {len(errors)} ticker(s) had errors: {errors[:3]}")

        if not results:
            logger.error("❌ No successful backtest results")
            return (
                jsonify(
                    {"error": "Backtests failed for all tickers", "details": errors}
                ),
                500,
            )

        # Calculate portfolio metrics
        portfolio_metrics = calculate_portfolio_metrics(results, req.capital)
        logger.info(
            f"📈 Results: Trades={portfolio_metrics.total_trades} | "
            f"Profitable={portfolio_metrics.profitable_tickers}/{portfolio_metrics.total_tickers} | "
            f"Return={portfolio_metrics.portfolio_return_pct:.2f}%"
        )

        # Generate AI analysis (verifier + recommender)
        logger.info("🤖 Generating AI analysis...")
        analysis = generate_analysis(llm, results, portfolio_metrics, req.query)

        # Build response
        logger.info(f"\n{'='*50}")
        logger.info(
            f"🏁 BACKTEST COMPLETE - Total time: {time.time() - start_time:.2f}s"
        )
        logger.info(f"{'='*50}")

        # Convert equity data to EquityPoint objects
        equity_points = (
            [
                EquityPoint(date=ep["date"], equity=ep["equity"])
                for ep in combined_equity
            ]
            if combined_equity
            else []
        )

        result = BacktestResult(
            strategy_code=compiled_code,
            portfolio_metrics=portfolio_metrics,
            ticker_results=results,
            equity_curve=equity_points,
            analysis=analysis,
            errors=errors if errors else [],
        )

        return jsonify(result.model_dump())

    except Exception as e:
        import traceback

        logger.error(f"❌ Unexpected error: {str(e)}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
