from flask import Blueprint, jsonify, request
import yfinance as yf
import pandas as pd

stocks_bp = Blueprint('stocks', __name__)

@stocks_bp.route('/stock/<ticker>/info', methods=['GET'])
def get_stock_info(ticker):
    """
    Get complete data (fundamentals) for a single stock.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        return jsonify({'status': 'success', 'data': info})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@stocks_bp.route('/stock/<ticker>/history', methods=['GET'])
def get_stock_history(ticker):
    """
    Get historical price data (OHLC + Volume) for a single stock.
    Query params:
    - period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max (default: max)
    - interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo (default: 1d)
    """
    period = request.args.get('period', 'max')
    interval = request.args.get('interval', '1d')
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval=interval)
        
        if hist.empty:
             return jsonify({'status': 'error', 'message': 'No data found'}), 404
        
        # Reset index to include Date/Datetime in the records
        hist.reset_index(inplace=True)
        
        # Convert to dict
        data = hist.to_dict(orient='records')
        
        return jsonify({'status': 'success', 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@stocks_bp.route('/stocks/history', methods=['GET'])
def get_multiple_stocks_history():
    """
    Get historical price data for multiple stocks.
    Query params:
    - tickers: comma-separated list of tickers (e.g., AAPL,MSFT,GOOG)
    - period: default 1mo
    - interval: default 1d
    """
    tickers = request.args.get('tickers')
    if not tickers:
        return jsonify({'status': 'error', 'message': 'Tickers parameter is required'}), 400
    
    ticker_list = [t.strip() for t in tickers.split(',')]
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')
    
    try:
        # download data
        # group_by='ticker' structure: Columns are MultiIndex (Ticker, Feature)
        data = yf.download(ticker_list, period=period, interval=interval, group_by='ticker', progress=False)
        
        result = {}
        
        if len(ticker_list) == 1:
            # yfinance returns a simple DataFrame if only one ticker, even with group_by='ticker' sometimes, 
            # but let's handle the standard single ticker return if it happens.
            # Actually yf.download behavior depends on version. 
            # Safer to treat it as a single DF if columns are not MultiIndex or if the first level isn't the ticker.
            
            if isinstance(data.columns, pd.MultiIndex):
                 # This path is usually taken if multiple tickers OR if forced.
                 # But with 1 ticker, it might just be the OHLC columns.
                 pass

            # If it's just one ticker, `data` is the dataframe for that ticker
            if len(data.columns) > 0 and not isinstance(data.columns, pd.MultiIndex):
                 data.reset_index(inplace=True)
                 result[ticker_list[0]] = data.to_dict(orient='records')
            else:
                 # MultiIndex case (shouldn't happen with list of 1 usually, but generic handling)
                 # If strict MultiIndex for 1 ticker:
                 ticker = ticker_list[0]
                 # Check if ticker is in the columns top level
                 if ticker in data.columns:
                     df = data[ticker].copy()
                     df.reset_index(inplace=True)
                     result[ticker] = df.to_dict(orient='records')
                 else:
                     # Maybe the columns ARE the features directly (Open, Close, etc)
                     # This happens if we downloaded 1 ticker.
                     data.reset_index(inplace=True)
                     result[ticker] = data.to_dict(orient='records')

        else:
            # Multiple tickers
            for ticker in ticker_list:
                # With group_by='ticker', we access data[ticker]
                # Note: if a ticker is invalid, yfinance might not include it in columns or include it as all NaNs?
                # usually it just omits or warns.
                
                # If valid data exists for ticker
                if ticker in data.columns.levels[0]:
                    df_ticker = data[ticker].copy()
                    df_ticker.reset_index(inplace=True)
                    # Drop rows where all cols are NaN (if any)
                    df_ticker.dropna(how='all', inplace=True)
                    result[ticker] = df_ticker.to_dict(orient='records')
        
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
