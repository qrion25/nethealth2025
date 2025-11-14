# api/routes.py
from __future__ import annotations

import json
import csv
import os
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
            pass

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
# Update Weather Location
# -------------------------------
@bp.post("/settings/update_location")
def update_location():
    payload = request.get_json(silent=True) or {}
    new_loc = payload.get("location", "").strip()

    if not new_loc:
        return jsonify({"error": "Invalid location"}), 400

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
    return jsonify({"name": "NetHealth2025", "version": "0.1.0"})


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
# Weather API
# -------------------------------
@bp.get("/weather")
def weather():
    """
    Returns current weather data from WeatherAPI.com.
    Reloads .env on each request so updates take effect immediately.
    """
    # Re-load new .env values when user updates location
    from dotenv import load_dotenv
    load_dotenv(override=True)

    if not requests:
        return jsonify({
            "temperature_f": 72,
            "location": "New York",
            "conditions": "Install requests library"
        })

    api_key = os.environ.get("WEATHERAPI_KEY")
    location = os.environ.get("WEATHER_LOCATION", "auto:ip")

    if not api_key:
        return jsonify({
            "temperature_f": 72,
            "location": "New York",
            "conditions": "Configure WEATHERAPI_KEY"
        })

    try:
        url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={location}"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()

        return jsonify({
            "temperature_f": round(data["current"]["temp_f"]),
            "location": f"{data['location']['name']}, {data['location']['region']}",
            "conditions": data["current"]["condition"]["text"]
        })

    except Exception as e:
        print(f"Weather API error: {e}")
        return jsonify({
            "temperature_f": "--",
            "location": "Unavailable",
            "conditions": "API Error"
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