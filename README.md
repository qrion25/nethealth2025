# NetHealth 2025

NetHealth 2025 is a lightweight system and environment dashboard built with **Flask**, **HTML/CSS**, and **JavaScript**.  
It’s designed as a sandbox project to demonstrate real-time updates of system health, local conditions, inspirational content, and price tracking. All in a single responsive web dashboard.

⸻

## Features

- **Dark/Light Mode + Themes**  
  Toggle between light/dark themes and experiment with additional color schemes (NetHealth, Sunset, Forest, Terminal).

- **Typography Picker**  
  Live font preview and switching for dashboard personalization.

- **Local Conditions (Stubbed)**  
  Displays temperature, time, and placeholder weather info.  
  Ready to be connected to real APIs (OpenWeatherMap, etc.).

- **System Health (Hybrid)**  
  - **Client-side**: battery, memory, and network checks using browser APIs.  
  - **Server-side**: `/api/system` endpoint that reports CPU, memory, storage, uptime, and network latency (via `psutil`).

- **Quotes (Inspiration Corner)**  
  Loads from `data/quotes.json` or falls back to built-in defaults.  
  Quotes fade smoothly, rotate randomly, and highlight the author in the theme accent color.

- **Price Tracker**  
  Reads `data/prices.csv` and computes deltas automatically.  
  Updated rows flow into a scrolling ticker.

⸻

## Project Structure
```
NetHealth2025
├── api
│   ├── __init__.py
│   └── routes.py          # Defines all API endpoints
├── app.py                  # Flask entrypoint
├── README.md               # Project documentation
├── requirements.txt        # Python dependencies
├── data
│   ├── prices.csv          # CSV input for price ticker
│   └── quotes.json         # JSON input for inspirational quotes
├── services
│   ├── __init__.py
│   └── system_info.py      # Cross-platform system metrics collection
├── static
│   ├── css
│   │   ├── main.css        # Base styles
│   │   └── themes.css      # Theme overrides + dark mode
│   ├── js
│   │   ├── dashboard.js    # Client-side dashboard logic
│   │   └── themes.js       # Theme/font handling logic
│   └── img                 # Placeholder for images/screenshots
├── templates
│   └── index.html          # Dashboard HTML (Jinja2 template)
├── scripts
│   └── dev_run.sh          # Helper script for local dev run
└── tests
    ├── conftest.py         # Pytest configuration
    └── test_system_info.py # Unit test for system_info service
```
⸻

## Setup & Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/yourusername/nethealth2025.git
   cd nethealth2025

	2.	Create a virtual environment

python3 -m venv .venv
source .venv/bin/activate


	3.	Install dependencies

pip install -r requirements.txt


	4.	Run the app

python app.py

Open http://127.0.0.1:5050 in your browser.

⸻

API Endpoints
	•	/api/health → Health check ({"ok": true})
	•	/api/version → App version info
	•	/api/quotes → Returns list of quotes
	•	/api/prices → Returns price list with computed deltas
	•	/api/weather → Returns stub weather info
	•	/api/system → Returns system information (CPU, memory, storage, uptime, network latency, etc.)

⸻

Development Notes
	•	Static Assets are served via static/. Add new CSS or JS here.
	•	Templates use Jinja2 (templates/index.html) and reference Flask’s url_for for assets.
	•	Data Files (prices.csv, quotes.json) can be edited manually to update the dashboard without restarting the app.
	•	Themes & Fonts are handled by themes.css + themes.js.
	•	System Metrics use psutil when available for cross-platform support (Mac, Linux, Windows).

⸻

Testing

Unit tests are included for the system information service.

Run tests with:

pytest -v


⸻

Roadmap
	•	Connect /api/weather to a real weather API.
	•	Expand system metrics with network throughput.
	•	Add persistent storage (SQLite or Postgres).
	•	Dockerize for easy deployment.
	•	Package a “no-terminal” static version for direct HTML usage.
	•	Improve latency tests with multi-host pings.

⸻
### Screenshots

Light & Dark Themes:
![NetHealth Light](static/img/nh_theme_light.png)  
![NetHealth Dark](static/img/nh_theme_dark.png)

Additional Themes:
![Sunset](static/img/sunset_theme_light.png)  
![Forest](static/img/forrest_theme_light.png)  
![Terminal](static/img/terminal_theme_light.png)

⸻
Contact
	•	Personal: rigel.leonard@gmail.com
	•	School: rigel.leonard31@bcmail.cuny.edu

