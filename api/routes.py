# api/routes.py
from __future__ import annotations
from flask import Blueprint, jsonify
from pathlib import Path
import json, csv, os
from collections import defaultdict
from datetime import datetime

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


# --- Helpers ---
def load_quotes() -> list[dict]:
    """
    Reads data/quotes.json if present; falls back to a small built-in list.
    """
    if QUOTES_PATH.exists():
        try:
            return json.loads(QUOTES_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    # fallback
    return [
        {"text": "The best way to predict the future is to create it.", "author": "Peter Drucker"},
        {"text": "Innovation distinguishes between a leader and a follower.", "author": "Steve Jobs"},
        {"text": "Focus on being productive instead of busy.", "author": "Tim Ferriss"},
        {"text": "Creativity is intelligence having fun.", "author": "Albert Einstein"},
        {"text": "Be yourself; everyone else is already taken.", "author": "Oscar Wilde"},
    ]


def load_prices_latest_with_change() -> list[dict]:
    """
    Reads data/prices.csv and returns latest price per item,
    plus delta vs previous entry for that item.

    CSV columns (required):
      date,item,price
    """
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

    # group by item, sort by date, compute change vs previous
    by_item = defaultdict(list)
    for r in rows:
        by_item[r["item"]].append(r)

    result = []
    for item, lst in by_item.items():
        lst.sort(key=lambda x: (x["dt"] is None, x["dt"]))  # safeguard
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

    # sort for stable UI (alphabetical)
    result.sort(key=lambda x: x["item"].lower())
    return result


# --- Endpoints ---
@bp.get("/health")
def health():
    return jsonify({"ok": True})


@bp.get("/version")
def version():
    return jsonify({"name": "NetHealth2025", "version": "0.1.0"})


@bp.get("/quotes")
def quotes():
    return jsonify({"quotes": load_quotes()})


@bp.get("/prices")
def prices():
    return jsonify({"prices": load_prices_latest_with_change()})


@bp.get("/weather")
def weather():
    """
    Returns current weather data from WeatherAPI.com.
    Falls back to stub data if API key not configured or request fails.
    """
    if not requests:
        return jsonify({
            "temperature_f": 72,
            "location": "New York",
            "conditions": "Install requests library"
        })
    
    api_key = os.environ.get('WEATHERAPI_KEY')
    
    if not api_key:
        # Fallback to stub data if no API key
        return jsonify({
            "temperature_f": 72,
            "location": "New York",
            "conditions": "Configure WEATHERAPI_KEY"
        })
    
    try:
        # Auto-detect location by IP, or specify location manually
        # Use 'auto:ip' for automatic IP-based location
        location = os.environ.get('WEATHER_LOCATION', 'auto:ip')
        
        url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={location}"
        
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        return jsonify({
            "temperature_f": round(data['current']['temp_f']),
            "location": f"{data['location']['name']}, {data['location']['region']}",
            "conditions": data['current']['condition']['text']
        })
    except Exception as e:
        print(f"Weather API error: {e}")
        return jsonify({
            "temperature_f": "--",
            "location": "Unavailable",
            "conditions": "API Error"
        })


@bp.get("/system")
def api_system():
    """
    Returns system information collected server-side.
    """
    from services.system_info import get_system_info
    return jsonify(get_system_info())


@bp.get("/network/devices")
def network_devices():
    """
    Returns list of devices discovered from ARP cache.
    """
    try:
        from services.network_devices import get_network_devices, guess_device_type
        
        devices = get_network_devices()
        
        # Enhance with device type guesses
        for device in devices:
            device['device_type'] = guess_device_type(device['vendor'], device['mac'])
        
        return jsonify({
            "devices": devices,
            "count": len(devices)
        })
    except Exception as e:
        return jsonify({
            "devices": [],
            "count": 0,
            "error": str(e)
        }), 500


# Alias so app.py can import consistently
api_bp = bp