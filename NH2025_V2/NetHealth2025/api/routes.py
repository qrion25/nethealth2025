# api/routes.py
from __future__ import annotations
from flask import Blueprint, jsonify, current_app
from pathlib import Path
import json, csv
from collections import defaultdict
from datetime import datetime

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

    - date must be ISO-ish (YYYY-MM-DD) or anything datetime can parse
    - item is a string
    - price is a float
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
        lst.sort(key=lambda x: (x["dt"] is None, x["dt"]))  # None first safeguard, then date
        if not lst:
            continue
        latest = lst[-1]["price"]
        prev = lst[-2]["price"] if len(lst) >= 2 else None

        if prev is None:
            change = None
            direction = "flat"
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
    Stub for now so the UI has data.
    Later you can hook a real weather provider or geolocation.
    """
    return jsonify({
        "temperature_f": 72,
        "location": "New York",
        "conditions": "Sunny"
    })

    # alias so app.py can import api_bp
api_bp = bp