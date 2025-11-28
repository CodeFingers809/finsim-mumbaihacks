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
            
            # Metrics
            ret, vol, sharpe = get_portfolio_metrics(w_vec, mean_returns.values, cov_matrix.values)
            
            results[strategy] = {
                "weights": weights_dict,
                "allocation": allocation_dict,
                "metrics": {
                    "return": float(ret),
                    "volatility": float(vol),
                    "sharpe": float(sharpe)
                }
            }
            
        # Individual Asset Metrics
        individual_metrics = {}
        for ticker in valid_tickers:
            ann_ret = mean_returns[ticker] * 252
            ann_vol = np.sqrt(cov_matrix.loc[ticker, ticker]) * np.sqrt(252)
            individual_metrics[ticker] = {
                "return": float(ann_ret),
                "volatility": float(ann_vol)
            }
            
        response = {
            "input": {
                "tickers": tickers,
                "capital": capital,
                "valid_tickers_found": valid_tickers
            },
            "assets": individual_metrics,
            "portfolios": results
        }
        
        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500