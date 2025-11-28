from flask import Blueprint, request, jsonify, send_file
import numpy as np
import io
# Optional: for image generation if we decide to add it later, we'd need matplotlib.
# For now, we will return exhaustive JSON data.

simulate_bp = Blueprint('simulate', __name__)

@simulate_bp.route('/simulate', methods=['POST'])
def run_simulation():
    """
    Run a Monte Carlo simulation for an investment portfolio.
    
    Expected JSON Input:
    - n_simulations (int): Number of simulations (100 - 100000). Default: 1000.
    - starting_capital (float): Initial portfolio value. Default: 10000.
    - risk_per_trade (float): Risk per trade as a percentage (e.g., 0.01 for 1%). Default: 0.01.
    - risk_reward_ratio (float): Ratio of reward to risk (e.g., 2.0). Default: 1.5.
    - win_rate (float): Probability of winning a trade (0.0 - 1.0). Default: 0.5.
    - num_trades (int): Number of trades per simulation. Default: 100.
    
    Returns:
    - JSON object containing statistical analysis and equity curve percentiles.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON payload'}), 400

        # Extract and validate parameters
        n_sims = int(data.get('n_simulations', 1000))
        start_cap = float(data.get('starting_capital', 10000.0))
        risk_pct = float(data.get('risk_per_trade', 0.01))
        rr_ratio = float(data.get('risk_reward_ratio', 1.5))
        win_rate = float(data.get('win_rate', 0.5))
        n_trades = int(data.get('num_trades', 100))

        # Constraints
        n_sims = max(100, min(n_sims, 100000))
        n_trades = max(10, min(n_trades, 5000))
        
        # Simulation Logic (Vectorized with NumPy)
        # 1. Generate outcomes: 1 for Win, 0 for Loss
        # Shape: (n_sims, n_trades)
        outcomes = np.random.choice(
            [1, 0], 
            size=(n_sims, n_trades), 
            p=[win_rate, 1 - win_rate]
        )
        
        # 2. Calculate PnL multipliers
        # If Win: balance * (1 + risk * rr)
        # If Loss: balance * (1 - risk)
        win_multiplier = 1 + (risk_pct * rr_ratio)
        loss_multiplier = 1 - risk_pct
        
        # Map outcomes to multipliers
        # where outcome is 1 -> win_multiplier, else -> loss_multiplier
        multipliers = np.where(outcomes == 1, win_multiplier, loss_multiplier)
        
        # 3. Calculate Equity Curves
        # Cumulative product along the trades axis
        # Start with 1.0 representing the initial capital multiplier
        # Prepend a column of 1s for the starting state
        
        # efficient cumulative product
        equity_curves = np.cumprod(multipliers, axis=1) * start_cap
        
        # Add starting capital column (index 0)
        start_col = np.full((n_sims, 1), start_cap)
        equity_curves = np.hstack((start_col, equity_curves))
        
        # --- Analysis ---
        
        final_equities = equity_curves[:, -1]
        
        # 1. Summary Statistics
        stats = {
            "mean_final_equity": float(np.mean(final_equities)),
            "median_final_equity": float(np.median(final_equities)),
            "std_dev_equity": float(np.std(final_equities)),
            "min_final_equity": float(np.min(final_equities)),
            "max_final_equity": float(np.max(final_equities)),
            "profit_probability": float(np.mean(final_equities > start_cap)),
            "ruin_probability": float(np.mean(final_equities <= 0)), # Simple ruin check
            # Return on Investment
            "mean_roi_pct": float((np.mean(final_equities) - start_cap) / start_cap * 100),
            "max_roi_pct": float((np.max(final_equities) - start_cap) / start_cap * 100),
        }

        # 2. Drawdown Analysis
        # Calculate running maximum for each simulation
        running_max = np.maximum.accumulate(equity_curves, axis=1)
        # Calculate drawdown percentage
        drawdowns = (equity_curves - running_max) / running_max
        # Max drawdown for each simulation (min value since drawdowns are negative)
        max_drawdowns = np.min(drawdowns, axis=1)
        
        stats["mean_max_drawdown_pct"] = float(np.mean(max_drawdowns) * 100)
        stats["worst_max_drawdown_pct"] = float(np.min(max_drawdowns) * 100) # The worst of the worst
        stats["median_max_drawdown_pct"] = float(np.median(max_drawdowns) * 100)

        # 3. Time Series Percentiles (for plotting)
        # We don't want to send 100k lines. Send percentiles: 5th, 25th, 50th, 75th, 95th
        percentiles = [5, 25, 50, 75, 95]
        percentile_curves = np.percentile(equity_curves, percentiles, axis=0)
        
        # Structure for response
        time_series_data = {}
        for i, p in enumerate(percentiles):
            time_series_data[f"p{p}"] = percentile_curves[i].tolist()
            
        # Add 'best' and 'worst' specific paths for reference
        best_idx = np.argmax(final_equities)
        worst_idx = np.argmin(final_equities)
        time_series_data["best_case"] = equity_curves[best_idx].tolist()
        time_series_data["worst_case"] = equity_curves[worst_idx].tolist()

        response_payload = {
            "input_parameters": {
                "n_simulations": n_sims,
                "starting_capital": start_cap,
                "risk_per_trade_pct": risk_pct * 100,
                "risk_reward_ratio": rr_ratio,
                "win_rate": win_rate,
                "num_trades": n_trades
            },
            "statistics": stats,
            "equity_curve_percentiles": time_series_data,
            "note": "equity_curve_percentiles contains lists of equity values over trade count (0 to num_trades)."
        }

        return jsonify(response_payload)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
