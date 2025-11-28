from flask import Flask
from app.routes.hello import hello_bp
from app.routes.simulate import simulate_bp
from app.routes.stocks import stocks_bp
from app.routes.optimize import optimize_bp
from app.routes.backtest import backtest_bp
from app.routes.fetch import fetch_bp


def create_app():
    """
    Application factory function to create and configure the Flask app.
    """
    app = Flask(__name__)

    # Register Blueprints
    # To add a new route file, import the blueprint here and register it.
    app.register_blueprint(hello_bp)
    app.register_blueprint(simulate_bp)
    app.register_blueprint(stocks_bp)
    app.register_blueprint(optimize_bp)
    app.register_blueprint(backtest_bp)
    app.register_blueprint(fetch_bp)

    @app.route("/health")
    def health_check():
        return {"status": "healthy"}

    return app
