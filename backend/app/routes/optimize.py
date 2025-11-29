from flask import Blueprint, request, jsonify
import yfinance as yf
import numpy as np
import pandas as pd
import scipy.optimize as sco
import scipy.cluster.hierarchy as sch

optimize_bp = Blueprint('optimize', __name__)

def get_portfolio_metrics(weights, mean_returns, cov_matrix):
    """
    Calculate portfolio return, volatility, and Sharpe ratio.
    Assumes risk_free_rate = 0 for Sharpe calculation.
    """
    weights = np.array(weights)
    ret = np.sum(mean_returns * weights) * 252
    vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(252)
    sharpe = ret / vol if vol > 0 else 0
    return ret, vol, sharpe

def get_diversification_ratio(weights, cov_matrix):
    """
    Calculate diversification ratio.
    DR = weighted average volatility / portfolio volatility
    Higher values indicate better diversification.
    """
    weights = np.array(weights)
    individual_vols = np.sqrt(np.diag(cov_matrix)) * np.sqrt(252)
    weighted_vol = np.sum(weights * individual_vols)
    portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(252)
    return weighted_vol / portfolio_vol if portfolio_vol > 0 else 1.0

def get_herfindahl_index(weights):
    """
    Calculate Herfindahl-Hirschman Index for concentration.
    HHI ranges from 1/n (perfectly diversified) to 1 (single asset).
    """
    weights = np.array(weights)
    return float(np.sum(weights ** 2))

def get_effective_n(weights):
    """
    Effective number of assets (inverse of HHI).
    """
    hhi = get_herfindahl_index(weights)
    return 1.0 / hhi if hhi > 0 else len(weights)

def get_risk_contribution(weights, cov_matrix):
    """
    Calculate marginal and percentage risk contribution per asset.
    """
    weights = np.array(weights)
    portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    # Marginal risk contribution
    marginal_contrib = np.dot(cov_matrix, weights) / portfolio_vol if portfolio_vol > 0 else np.zeros_like(weights)
    
    # Percentage risk contribution
    risk_contrib = weights * marginal_contrib
    pct_risk_contrib = risk_contrib / np.sum(risk_contrib) if np.sum(risk_contrib) > 0 else np.zeros_like(weights)
    
    return pct_risk_contrib

def estimate_max_drawdown(returns, weights):
    """
    Estimate maximum drawdown from historical portfolio returns.
    """
    weights = np.array(weights)
    portfolio_returns = np.dot(returns.values, weights)
    cumulative = (1 + portfolio_returns).cumprod()
    running_max = np.maximum.accumulate(cumulative)
    drawdown = (cumulative - running_max) / running_max
    return float(np.min(drawdown))

def get_var_cvar(returns, weights, confidence=0.95):
    """
    Calculate Value at Risk and Conditional VaR (Expected Shortfall).
    """
    weights = np.array(weights)
    portfolio_returns = np.dot(returns.values, weights)
    var = np.percentile(portfolio_returns, (1 - confidence) * 100)
    cvar = portfolio_returns[portfolio_returns <= var].mean()
    # Annualize (approximate)
    return float(var * np.sqrt(252)), float(cvar * np.sqrt(252)) if not np.isnan(cvar) else float(var * np.sqrt(252))

def get_correlation_insights(corr_matrix, tickers):
    """
    Extract correlation insights - most/least correlated pairs.
    """
    n = len(tickers)
    correlations = []
    
    for i in range(n):
        for j in range(i + 1, n):
            correlations.append({
                "pair": [tickers[i], tickers[j]],
                "correlation": float(corr_matrix.iloc[i, j])
            })
    
    # Sort by correlation
    correlations.sort(key=lambda x: x["correlation"])
    
    return {
        "least_correlated": correlations[:3] if len(correlations) >= 3 else correlations,
        "most_correlated": correlations[-3:][::-1] if len(correlations) >= 3 else correlations[::-1],
        "avg_correlation": float(np.mean([c["correlation"] for c in correlations])) if correlations else 0
    }

def get_min_risk_weights(mean_returns, cov_matrix):
    num_assets = len(mean_returns)
    args = (cov_matrix)
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bounds = tuple((0, 1) for asset in range(num_assets))
    
    def portfolio_volatility(weights, cov_matrix):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    result = sco.minimize(portfolio_volatility, num_assets*[1./num_assets,], args=args,
                          method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x

def get_max_sharpe_weights(mean_returns, cov_matrix, risk_free_rate=0.0, l2_reg=0.5):
    """
    Maximize Sharpe Ratio with L2 regularization to encourage diversification.
    l2_reg: Regularization parameter. Higher value = more diversification.
    """
    num_assets = len(mean_returns)
    args = (mean_returns, cov_matrix)
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bounds = tuple((0, 1) for asset in range(num_assets))
    
    def neg_sharpe_ratio(weights, mean_returns, cov_matrix):
        p_ret = np.sum(mean_returns * weights) * 252
        p_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(252)
        
        sharpe = (p_ret - risk_free_rate) / p_vol if p_vol > 0 else 0
        
        # Add L2 regularization penalty: -Sharpe + gamma * sum(w^2)
        # sum(w^2) is minimized when weights are equal (1/N).
        penalty = l2_reg * np.sum(weights**2)
        
        return -sharpe + penalty
    
    result = sco.minimize(neg_sharpe_ratio, num_assets*[1./num_assets,], args=args,
                          method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x

def get_fractional_kelly_weights(returns, fraction=0.5):
    """
    Calculate weights based on Fractional Kelly Criterion using CRRA Utility.
    Fraction = 0.5 (Half Kelly) implies Relative Risk Aversion (gamma) = 2.
    """
    num_assets = returns.shape[1]
    
    # Gamma (Risk Aversion) = 1 / fraction
    gamma = 1.0 / fraction
    
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bounds = tuple((0, 1) for asset in range(num_assets))
    
    def neg_utility(weights, returns):
        # Portfolio returns series (daily)
        port_rets = np.dot(returns, weights)
        
        # Avoid domain errors for utility functions (log or power of <= 0)
        safe_rets = np.maximum(port_rets + 1, 1e-6)
        
        if abs(gamma - 1.0) < 1e-6:
            # Log Utility (Full Kelly)
            return -np.sum(np.log(safe_rets))
        else:
            # CRRA Utility (Power Utility)
            return -np.sum((safe_rets**(1-gamma)) / (1-gamma))
        
    result = sco.minimize(neg_utility, num_assets*[1./num_assets,], args=(returns,),
                          method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x

# --- HRP Implementation ---

def get_hrp_weights(returns):
    # 1. Cluster
    cov = returns.cov()
    corr = returns.corr()
    
    # Dist matrix based on correlation
    dist = np.sqrt(np.clip((1 - corr) / 2, a_min=0, a_max=None))
    link = sch.linkage(dist, 'single')
    
    # Sort (Quasi-Diagonalization)
    sort_ix = get_quasi_diag(link)
    sort_ix = corr.columns[sort_ix].tolist() # Get ticker names in sorted order
    
    # Reorder covariance
    df_cov = cov.loc[sort_ix, sort_ix]
    
    # 2. Recursive Bisection
    hrp_weights = get_rec_bisection(df_cov, sort_ix)
    
    # Realign weights to original order (returns.columns) before returning
    # hrp_weights is a pd.Series with index as tickers
    return hrp_weights.reindex(returns.columns).fillna(0).values

def get_quasi_diag(link):
    link = link.astype(int)
    sort_ix = pd.Series([link[-1, 0], link[-1, 1]])
    num_items = link[-1, 3]
    
    while sort_ix.max() >= num_items:
        sort_ix.index = range(0, sort_ix.shape[0] * 2, 2)
        df0 = sort_ix[sort_ix >= num_items]
        i = df0.index
        j = df0.values - num_items
        sort_ix[i] = link[j, 0]
        df0 = pd.Series(link[j, 1], index=i + 1)
        sort_ix = pd.concat([sort_ix, df0]) # Use concat instead of append
        sort_ix = sort_ix.sort_index()
        sort_ix.index = range(sort_ix.shape[0])
    
    return sort_ix.tolist()

def get_rec_bisection(cov, sort_ix):
    w = pd.Series(1, index=sort_ix)
    c_items = [sort_ix]
    
    while len(c_items) > 0:
        # Split the list of items in two
        c_items = [i[j:k] for i in c_items for j, k in ((0, len(i) // 2), (len(i) // 2, len(i))) if len(i) > 1]
        
        for i in range(0, len(c_items), 2):
            c_left = c_items[i]
            c_right = c_items[i + 1]
            
            v_left = get_cluster_var(cov, c_left)
            v_right = get_cluster_var(cov, c_right)
            
            alpha = 1 - v_left / (v_left + v_right)
            
            w[c_left] *= alpha
            w[c_right] *= 1 - alpha
            
    return w

def get_cluster_var(cov, c_items):
    cov_slice = cov.loc[c_items, c_items]
    w = get_ivp(cov_slice).reshape(-1, 1)
    return np.dot(np.dot(w.T, cov_slice), w)[0, 0]

def get_ivp(cov):
    ivp = 1. / np.diag(cov)
    ivp /= ivp.sum()
    return ivp

# --- End HRP ---

@optimize_bp.route('/optimize', methods=['POST'])
def optimize_route():
    """
    Optimize portfolio weights.
    Input: JSON {"tickers": ["AAPL", "MSFT"], "capital": 10000}
    """
    try:
        data = request.get_json()
        tickers = data.get('tickers')
        capital = float(data.get('capital', 10000))
        
        if not tickers or not isinstance(tickers, list) or len(tickers) < 2:
            return jsonify({'error': 'Please provide at least 2 tickers in a list.'}), 400

        # Clean tickers
        tickers = [t.strip().upper() for t in tickers]
        
        # Fetch data
        # Using 'Close' (which is auto-adjusted) for returns
        df = yf.download(tickers, period="2y", progress=False, auto_adjust=True)['Close']
        
        # Check data availability
        if df.empty:
            return jsonify({'error': 'No data found for tickers.'}), 404
            
        # Handle missing data (drop cols with too many NaNs, fill forward)
        df.dropna(axis=1, how='all', inplace=True)
        df.fillna(method='ffill', inplace=True)
        df.dropna(inplace=True) # Drop initial rows with NaNs
        
        valid_tickers = df.columns.tolist()
        if len(valid_tickers) < 2:
             return jsonify({'error': 'Not enough valid data for at least 2 tickers.'}), 400
        
        # Calculate Returns
        daily_returns = df.pct_change().dropna()
        mean_returns = daily_returns.mean()
        cov_matrix = daily_returns.cov()
        
        # --- Run Optimizations ---
        
        results = {}
        kelly_fraction = 0.5 # Half Kelly
        
        # 1. Min Risk
        w_min_risk = get_min_risk_weights(mean_returns.values, cov_matrix.values)
        
        # 2. Diversified Max Sharpe (with L2 regularization)
        w_max_sharpe = get_max_sharpe_weights(mean_returns.values, cov_matrix.values, l2_reg=0.5)
        
        # 3. HRP
        w_hrp = get_hrp_weights(daily_returns)
        
        # 4. Fractional Kelly
        w_kelly = get_fractional_kelly_weights(daily_returns.values, fraction=kelly_fraction)
        
        # Format Results
        
        weight_vectors = {
            'min_risk': w_min_risk,
            'max_sharpe': w_max_sharpe,
            'hrp': w_hrp,
            'kelly': w_kelly
        }
        
        for strategy, w_vec in weight_vectors.items():
            # Clean weights (round and handle small negatives)
            w_vec = np.maximum(w_vec, 0) # Enforce non-negative just in case
            w_vec = w_vec / np.sum(w_vec) # Renormalize
            
            # Create weight dict
            weights_dict = {ticker: float(weight) for ticker, weight in zip(valid_tickers, w_vec)}
            
            # Allocation
            allocation_dict = {ticker: float(weight * capital) for ticker, weight in zip(valid_tickers, w_vec)}
            
            # Basic Metrics
            ret, vol, sharpe = get_portfolio_metrics(w_vec, mean_returns.values, cov_matrix.values)
            
            # Advanced Metrics
            div_ratio = get_diversification_ratio(w_vec, cov_matrix.values)
            hhi = get_herfindahl_index(w_vec)
            effective_n = get_effective_n(w_vec)
            risk_contrib = get_risk_contribution(w_vec, cov_matrix.values)
            max_dd = estimate_max_drawdown(daily_returns, w_vec)
            var_95, cvar_95 = get_var_cvar(daily_returns, w_vec, confidence=0.95)
            
            # Risk contribution per asset
            risk_contribution_dict = {ticker: float(rc) for ticker, rc in zip(valid_tickers, risk_contrib)}
            
            # Find dominant asset (highest weight)
            sorted_weights = sorted(weights_dict.items(), key=lambda x: x[1], reverse=True)
            top_holding = sorted_weights[0] if sorted_weights else ("N/A", 0)
            
            results[strategy] = {
                "weights": weights_dict,
                "allocation": allocation_dict,
                "risk_contribution": risk_contribution_dict,
                "metrics": {
                    "return": float(ret),
                    "volatility": float(vol),
                    "sharpe": float(sharpe),
                    "diversification_ratio": float(div_ratio),
                    "concentration_hhi": float(hhi),
                    "effective_assets": float(effective_n),
                    "max_drawdown": float(max_dd),
                    "var_95": float(var_95),
                    "cvar_95": float(cvar_95)
                },
                "insights": {
                    "top_holding": {"ticker": top_holding[0], "weight": float(top_holding[1])},
                    "is_concentrated": hhi > 0.5,
                    "is_well_diversified": div_ratio > 1.2 and effective_n > len(valid_tickers) * 0.6
                }
            }
            
        # Individual Asset Metrics
        individual_metrics = {}
        for ticker in valid_tickers:
            ann_ret = mean_returns[ticker] * 252
            ann_vol = np.sqrt(cov_matrix.loc[ticker, ticker]) * np.sqrt(252)
            sharpe = ann_ret / ann_vol if ann_vol > 0 else 0
            individual_metrics[ticker] = {
                "return": float(ann_ret),
                "volatility": float(ann_vol),
                "sharpe": float(sharpe)
            }
        
        # Correlation matrix for insights
        corr_matrix = daily_returns.corr()
        correlation_insights = get_correlation_insights(corr_matrix, valid_tickers)
        
        # Find best/worst assets
        sorted_by_return = sorted(individual_metrics.items(), key=lambda x: x[1]["return"], reverse=True)
        sorted_by_sharpe = sorted(individual_metrics.items(), key=lambda x: x[1]["sharpe"], reverse=True)
        sorted_by_volatility = sorted(individual_metrics.items(), key=lambda x: x[1]["volatility"])
        
        asset_insights = {
            "best_return": {"ticker": sorted_by_return[0][0], "value": sorted_by_return[0][1]["return"]},
            "worst_return": {"ticker": sorted_by_return[-1][0], "value": sorted_by_return[-1][1]["return"]},
            "best_sharpe": {"ticker": sorted_by_sharpe[0][0], "value": sorted_by_sharpe[0][1]["sharpe"]},
            "lowest_volatility": {"ticker": sorted_by_volatility[0][0], "value": sorted_by_volatility[0][1]["volatility"]},
            "highest_volatility": {"ticker": sorted_by_volatility[-1][0], "value": sorted_by_volatility[-1][1]["volatility"]}
        }
        
        # Strategy comparison insights
        strategy_comparison = {
            "best_return": max(results.items(), key=lambda x: x[1]["metrics"]["return"])[0],
            "lowest_risk": min(results.items(), key=lambda x: x[1]["metrics"]["volatility"])[0],
            "best_sharpe": max(results.items(), key=lambda x: x[1]["metrics"]["sharpe"])[0],
            "most_diversified": max(results.items(), key=lambda x: x[1]["metrics"]["diversification_ratio"])[0],
        }
            
        response = {
            "input": {
                "tickers": tickers,
                "capital": capital,
                "valid_tickers_found": valid_tickers,
                "data_period": "2 years",
                "trading_days_analyzed": int(len(daily_returns))
            },
            "assets": individual_metrics,
            "asset_insights": asset_insights,
            "correlation_insights": correlation_insights,
            "portfolios": results,
            "strategy_comparison": strategy_comparison,
            "recommendations": generate_recommendations(results, asset_insights, correlation_insights)
        }
        
        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_recommendations(results, asset_insights, correlation_insights):
    """Generate actionable recommendations based on optimization results."""
    recommendations = []
    
    # Best strategy recommendation
    best_sharpe_strategy = max(results.items(), key=lambda x: x[1]["metrics"]["sharpe"])
    recommendations.append({
        "type": "strategy",
        "title": f"Optimal Risk-Adjusted Strategy: {best_sharpe_strategy[0].replace('_', ' ').title()}",
        "description": f"With a Sharpe ratio of {best_sharpe_strategy[1]['metrics']['sharpe']:.2f}, this strategy offers the best risk-adjusted returns."
    })
    
    # Diversification insight
    avg_corr = correlation_insights.get("avg_correlation", 0)
    if avg_corr > 0.7:
        recommendations.append({
            "type": "warning",
            "title": "High Portfolio Correlation",
            "description": f"Average correlation of {avg_corr:.2f} suggests limited diversification benefits. Consider adding uncorrelated assets."
        })
    elif avg_corr < 0.3:
        recommendations.append({
            "type": "positive",
            "title": "Excellent Diversification",
            "description": f"Low average correlation of {avg_corr:.2f} indicates strong diversification benefits."
        })
    
    # Best performer insight
    best_asset = asset_insights.get("best_sharpe", {})
    if best_asset:
        recommendations.append({
            "type": "insight",
            "title": f"Top Performer: {best_asset.get('ticker', 'N/A')}",
            "description": f"Highest risk-adjusted return with Sharpe ratio of {best_asset.get('value', 0):.2f}."
        })
    
    # Risk warning
    min_risk = results.get("min_risk", {}).get("metrics", {})
    if min_risk.get("volatility", 0) > 0.25:
        recommendations.append({
            "type": "warning",
            "title": "High Minimum Volatility",
            "description": f"Even the minimum risk portfolio has {min_risk.get('volatility', 0)*100:.1f}% volatility. Consider adding more stable assets."
        })
    
    return recommendations