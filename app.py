# app.py
import argparse
from flask import Flask, render_template
from api.routes import api_bp
from dotenv import load_dotenv
import os
import sys

print(">>> PYTHON EXECUTABLE:", sys.executable)

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return render_template("index.html")

    return app

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5050, help="Port to run the app on")
    args = parser.parse_args()

    # Confirm environment loaded
    print("Loaded environment:")
    print(f"  WEATHERAPI_KEY: {'set' if os.getenv('WEATHERAPI_KEY') else 'missing'}")
    print(f"  WEATHER_LOCATION: {os.getenv('WEATHER_LOCATION', 'not set')}")

    app = create_app()
    app.run(host="0.0.0.0", port=args.port, debug=True)