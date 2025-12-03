# api/routes.py
from __future__ import annotations

import json
import csv
import os
import logging
from pathlib import Path
from collections import defaultdict
from datetime import datetime

from flask import Blueprint, jsonify, request

try:
    import requests
except ImportError:
    requests = None


bp = Blueprint("api", __name__, url_prefix="/api")

# --- Paths ---
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
QUOTES_PATH = DATA_DIR / "quotes.json"
PRICES_PATH = DATA_DIR / "prices.csv"
ENV_PATH = ROOT / ".env"


# -------------------------------
# Quotes Loader
# -------------------------------
def load_quotes() -> list[dict]:
    if QUOTES_PATH.exists():
        try:
            return json.loads(QUOTES_PATH.read_text(encoding="utf-8"))
        except Exception:
            logging.warning("Failed to load quotes", exc_info=True)

    return [
        {"text": "The best way to predict the future is to create it.", "author": "Peter Drucker"},
        {"text": "Innovation distinguishes between a leader and a follower.", "author": "Steve Jobs"},
        {"text": "Focus on being productive instead of busy.", "author": "Tim Ferriss"},
        {"text": "Creativity is intelligence having fun.", "author": "Albert Einstein"},
        {"text": "Be yourself; everyone else is already taken.", "author": "Oscar Wilde"},
    ]


# -------------------------------
# Prices Loader
# -------------------------------
def load_prices_latest_with_change() -> list[dict]:
    if not PRICES_PATH.exists():
        return []

    rows = []
    with PRICES_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            try:
                d = r.get("date", "").strip()
                item = r.get("item", "").strip()
                price = float(r.get("price", "0").strip())
                dt = datetime.fromisoformat(d) if d else None
            except Exception:
                continue
            rows.append({"dt": dt, "item": item, "price": price})

    by_item = defaultdict(list)
    for r in rows:
        by_item[r["item"]].append(r)

    result = []
    for item, lst in by_item.items():
        lst.sort(key=lambda x: (x["dt"] is None, x["dt"]))
        if not lst:
            continue

        latest = lst[-1]["price"]
        prev = lst[-2]["price"] if len(lst) >= 2 else None

        if prev is None:
            change, direction = None, "flat"
        else:
            delta = latest - prev
            if abs(delta) < 1e-9:
                direction = "flat"
            elif delta > 0:
                direction = "up"
            else:
                direction = "down"
            change = delta

        result.append({
            "item": item,
            "price": latest,
            "change": change,
            "direction": direction
        })

    result.sort(key=lambda x: x["item"].lower())
    return result

# -------------------------------
# Update Weather API Key
# -------------------------------
@bp.post("/settings/update_api_key")
def update_api_key():
    payload = request.get_json(silent=True) or {}
    api_key = payload.get("api_key", "").strip()
    
    # Basic validation
    if not api_key:
        return jsonify({"error": "API key cannot be empty"}), 400
    if len(api_key) < 20 or len(api_key) > 40:
        return jsonify({"error": "Invalid API key format"}), 400
    if "\n" in api_key or "=" in api_key or " " in api_key:
        return jsonify({"error": "Invalid characters in API key"}), 400

    # Read existing .env if present
    lines = []
    if ENV_PATH.exists():
        lines = ENV_PATH.read_text(encoding="utf-8").splitlines()

    updated = False
    new_lines = []

    for line in lines:
        if line.startswith("WEATHERAPI_KEY="):
            new_lines.append(f"WEATHERAPI_KEY={api_key}")
            updated = True
        else:
            new_lines.append(line)

    # If key not found, append it
    if not updated:
        new_lines.append(f"WEATHERAPI_KEY={api_key}")

    # Write back cleanly
    ENV_PATH.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

    return jsonify({"ok": True})


# -------------------------------
# Check API Key Status
# -------------------------------
@bp.get("/settings/api_status")
def api_status():
    """Check if weather API key is configured and working."""
    from dotenv import load_dotenv
    load_dotenv(override=True)
    
    api_key = os.environ.get("WEATHERAPI_KEY", "").strip()
    
    if not api_key:
        return jsonify({
            "configured": False,
            "valid": False,
            "message": "No API key configured"
        })
    
    # Test the API key with a simple request
    if requests:
        try:
            url = f"https://api.weatherapi.com/v1/current.json?key={api_key}&q=London"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                return jsonify({
                    "configured": True,
                    "valid": True,
                    "message": "API key is valid"
                })
            elif response.status_code == 401:
                return jsonify({
                    "configured": True,
                    "valid": False,
                    "message": "API key is invalid"
                })
            else:
                return jsonify({
                    "configured": True,
                    "valid": False,
                    "message": f"API error: {response.status_code}"
                })
        except Exception as e:
            return jsonify({
                "configured": True,
                "valid": False,
                "message": f"Connection error: {str(e)}"
            })
    
    return jsonify({
        "configured": True,
        "valid": None,
        "message": "Cannot verify (requests library not available)"
    })

# -------------------------------
# Update Weather Location
# -------------------------------
@bp.post("/settings/update_location")
def update_location():
    payload = request.get_json(silent=True) or {}
    new_loc = payload.get("location", "").strip()
    if "\n" in new_loc or "=" in new_loc:
        return jsonify({"error": "Invalid characters in location"}), 400

    # Read existing .env if present
    lines = []
    if ENV_PATH.exists():
        lines = ENV_PATH.read_text(encoding="utf-8").splitlines()

    updated = False
    new_lines = []

    for line in lines:
        if line.startswith("WEATHER_LOCATION="):
            new_lines.append(f"WEATHER_LOCATION={new_loc}")
            updated = True
        else:
            new_lines.append(line)

    # If key not found, append it
    if not updated:
        new_lines.append(f"WEATHER_LOCATION={new_loc}")

    # Write back cleanly
    ENV_PATH.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

    return jsonify({"ok": True})


# -------------------------------
# Health
# -------------------------------
@bp.get("/health")
def health():
    return jsonify({"ok": True})


# -------------------------------
# Version
# -------------------------------
@bp.get("/version")
def version():
    return jsonify({"name": "NetHealth2025", "version": "4.3.0"})


# -------------------------------
# Quotes API
# -------------------------------
@bp.get("/quotes")
def quotes():
    return jsonify({"quotes": load_quotes()})


# -------------------------------
# Prices API
# -------------------------------
@bp.get("/prices")
def prices():
    return jsonify({"prices": load_prices_latest_with_change()})


# -------------------------------
# Weather API (with forecast)
# -------------------------------
@bp.get("/weather")
def weather():
    """
    Returns current weather + 7-day forecast from WeatherAPI.com.
    Reloads .env on each request so updates take effect immediately.
    """
    from dotenv import load_dotenv
    load_dotenv(override=True)

    if not requests:
        return jsonify({
            "temperature_f": 72,
            "feels_like_f": 70,
            "humidity": 50,
            "wind_mph": 5,
            "location": "New York",
            "conditions": "Install requests library",
            "hourly": [],
            "daily": []
        })

    api_key = os.environ.get("WEATHERAPI_KEY")
    location = os.environ.get("WEATHER_LOCATION", "auto:ip")

    if not api_key:
        return jsonify({
            "temperature_f": 72,
            "feels_like_f": 70,
            "humidity": 50,
            "wind_mph": 5,
            "location": "New York",
            "conditions": "Configure WEATHERAPI_KEY",
            "hourly": [],
            "daily": []
        })

    try:
        url = f"https://api.weatherapi.com/v1/forecast.json?key={api_key}&q={location}&days=7&aqi=no&alerts=no"
        response = requests.get(url, timeout=8)
        response.raise_for_status()
        data = response.json()

        current = data.get("current", {})
        location_data = data.get("location", {})
        forecast_days = data.get("forecast", {}).get("forecastday", [])

        # Build hourly forecast (next 5 hours from now)
        hourly = []
        from datetime import datetime as dt
        now_epoch = current.get("last_updated_epoch", 0)
        
        for day in forecast_days[:2]:  # Today and tomorrow
            for hour in day.get("hour", []):
                hour_epoch = hour.get("time_epoch", 0)
                if hour_epoch > now_epoch and len(hourly) < 5:
                    hourly.append({
                        "time": hour.get("time", "")[-5:],  # "HH:MM"
                        "temp_f": round(hour.get("temp_f", 0)),
                        "condition": hour.get("condition", {}).get("text", ""),
                        "code": hour.get("condition", {}).get("code", 1000),
                        "chance_of_rain": hour.get("chance_of_rain", 0)
                    })

        # Build daily forecast (7 days)
        daily = []
        for day in forecast_days:
            day_data = day.get("day", {})
            daily.append({
                "date": day.get("date", ""),
                "high_f": round(day_data.get("maxtemp_f", 0)),
                "low_f": round(day_data.get("mintemp_f", 0)),
                "condition": day_data.get("condition", {}).get("text", ""),
                "code": day_data.get("condition", {}).get("code", 1000),
                "chance_of_rain": day_data.get("daily_chance_of_rain", 0)
            })

        return jsonify({
            "temperature_f": round(current.get("temp_f", 0)),
            "feels_like_f": round(current.get("feelslike_f", 0)),
            "humidity": current.get("humidity", 0),
            "wind_mph": round(current.get("wind_mph", 0)),
            "location": f"{location_data.get('name', '')}, {location_data.get('region', '')}",
            "conditions": current.get("condition", {}).get("text", ""),
            "code": current.get("condition", {}).get("code", 1000),
            "hourly": hourly,
            "daily": daily
        })

    except Exception as e:
        logging.error(f"Weather API error: {e}")
        return jsonify({
            "temperature_f": "--",
            "feels_like_f": "--",
            "humidity": "--",
            "wind_mph": "--",
            "location": "Unavailable",
            "conditions": "API Error",
            "hourly": [],
            "daily": []
        })

# -------------------------------
# System Info
# -------------------------------
@bp.get("/system")
def api_system():
    from services.system_info import get_system_info
    return jsonify(get_system_info())


# -------------------------------
# Network Devices
# -------------------------------
@bp.get("/network/devices")
def network_devices():
    try:
        from services.network_devices import get_network_devices, guess_device_type

        devices = get_network_devices()
        for device in devices:
            device["device_type"] = guess_device_type(device["vendor"], device["mac"])

        return jsonify({"devices": devices, "count": len(devices)})
    except Exception as e:
        return jsonify({"devices": [], "count": 0, "error": str(e)}), 500


# Alias so app.py can import easily
api_bp = bp
