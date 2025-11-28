# Flask API Boilerplate

A simple, modular, and extensible Flask API backend template.

## Setup

1.  **Activate the virtual environment:**
    ```bash
    source .venv/bin/activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the application:**
    ```bash
    python run.py
    ```

The API will be available at `http://localhost:5000`.

## Project Structure

-   `run.py`: Entry point for the application.
-   `app/`: Main application package.
    -   `__init__.py`: Contains the `create_app` factory function.
    -   `routes/`: Directory for route modules (Blueprints).
        -   `hello.py`: Example route module.

## Adding New Routes

To add a new set of routes (e.g., for "users"):

1.  Create a new file in `app/routes/`, e.g., `users.py`.
2.  Define a Blueprint in that file:
    ```python
    from flask import Blueprint, jsonify

    users_bp = Blueprint('users', __name__)

    @users_bp.route('/', methods=['GET'])
    def get_users():
        return jsonify([])
    ```
3.  Register the blueprint in `app/__init__.py`:
    ```python
    from app.routes.users import users_bp
    # ... inside create_app ...
    app.register_blueprint(users_bp, url_prefix='/api/users')
    ```
