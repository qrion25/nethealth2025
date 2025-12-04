# NetHealth 2025

![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.1-lightgrey.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)

A lightweight, modern system and environment dashboard built with **Flask**, **HTML/CSS**, and **JavaScript**.

NetHealth 2025 provides real-time system health monitoring, weather forecasts, network device discovery, and inspirational content—all in a beautiful, responsive interface.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [What's New in v4.3.0](#whats-new-in-v430)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)
- [Contact](#contact)

---

## Quick Start

```bash
git clone https://github.com/qrion25/nethealth2025.git
cd nethealth2025
pip install -r requirements.txt or pip3 install -r requirements.txt
python app.py
```

Open [http://127.0.0.1:5050](http://127.0.0.1:5050) — that's it!

**First time?** Click the gear icon in the header to add your free [WeatherAPI](https://www.weatherapi.com/signup.aspx) key. No `.env` file needed.

---

## Features

### Weather and Forecasts
- Real-time weather with 7-day forecast and hourly predictions
- 3D flip card interface — click to reveal detailed forecast
- Smart outfit suggestions based on feels-like temperature, humidity, and wind
- Rain chance indicators on daily forecast
- Auto-refresh every 10 minutes

### Split-Flap Clock
- Retro-style clock with animated split-flap digits
- Full-screen mode with resizable display
- Syncs with your dashboard theme (light/dark)
- Access via clock icon in header

### System Monitoring
- CPU, RAM, and storage usage with visual progress bars
- Network connectivity and response time
- Battery level (when available)
- Cross-platform support (macOS, Linux, Windows)

### Network Discovery
- Auto-detect devices on your local network
- MAC address vendor lookup (IEEE OUI database)
- Device type identification (Router, Mobile, Computer, Smart Device, etc.)
- Auto-refresh every 2 minutes

### Customization
- Dark/Light mode with smooth transitions
- 4 color themes: NetHealth, Sunset, Forest, Terminal
- Typography picker: Inter, Playfair Display, Monospace, System UI
- Theme-aware logo and icons

### Content Widgets
- Inspiration Corner: Rotating motivational quotes
- Price Tracker: Grocery prices with trend indicators

---

## What's New in v4.3.0

### Simplified Setup
- No more manual `.env` creation — configure your API key directly from the UI
- Click the gear icon, paste your WeatherAPI key, done
- Key auto-saves to `.env` file for persistence

### Enhanced Weather
- Flip card interface with front (current) and back (forecast) views
- Hourly forecast (next 5 hours) with staggered animations
- Daily forecast (7 days) with high/low temps and rain chance
- Refresh button on weather card (won't flip the card)
- Keyboard accessible (Enter/Space to flip, Escape to close)

### Split-Flap Clock
- Standalone clock page with retro split-flap animation
- Resizable via drag handle
- Theme sync with main dashboard

### UI/UX Improvements
- Loading spinners for forecast sections
- Empty state improvements for network devices
- Custom scrollbar styling
- Enhanced focus states for accessibility
- Reduced motion support (`prefers-reduced-motion`)

---

## Installation

### Prerequisites
- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/downloads/))

### Standard Installation

```bash
# Clone the repository
git clone https://github.com/qrion25/nethealth2025.git
cd nethealth2025

# Create virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Download OUI database (for network device vendor lookup)
python scripts/download_oui.py

# Run the app
python app.py
```

### macOS App Mode
Double-click `NetHealth2025.app` — it launches Flask and opens your browser automatically.

---

## Configuration

### Weather API (Recommended)

**Option 1: Via Dashboard UI (Easiest)**
1. Open the dashboard
2. Click the gear icon in the header
3. Paste your [WeatherAPI](https://www.weatherapi.com/signup.aspx) key
4. Click Save — weather loads automatically

**Option 2: Environment Variable**
```bash
export WEATHERAPI_KEY='your_api_key_here'
export WEATHER_LOCATION='New York City'  # Optional
```

**Option 3: `.env` File**
```env
WEATHERAPI_KEY=your_api_key_here
WEATHER_LOCATION=New York City
```

### Custom Port
```bash
python app.py --port 5051
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/health` | Health check |
| `/api/version` | App version info |
| `/api/weather` | Current weather data |
| `/api/weather/forecast` | 7-day forecast with hourly data |
| `/api/system` | System metrics (CPU, RAM, storage) |
| `/api/network/devices` | Discovered network devices |
| `/api/quotes` | Inspirational quotes |
| `/api/prices` | Price tracker data |
| `/api/settings/api_status` | Check if API key is configured |
| `/api/settings/update_api_key` | Save API key via UI |
| `/clock` | Split-flap clock page |

---

## Project Structure

```
NetHealth2025/
├── app.py                      # Flask entrypoint
├── api/routes.py               # API endpoints
├── services/
│   ├── system_info.py          # System metrics
│   └── network_devices.py      # Network discovery
├── static/
│   ├── css/
│   │   ├── main.css            # Base styles
│   │   └── themes.css          # Theme system
│   └── js/
│       ├── dashboard.js        # Dashboard logic
│       └── themes.js           # Theme handling
├── templates/
│   ├── index.html              # Main dashboard
│   └── clock.html              # Split-flap clock
├── data/
│   ├── prices.csv              # Price tracker data
│   ├── quotes.json             # Inspirational quotes
│   └── oui.txt                 # IEEE OUI database
└── scripts/
    └── download_oui.py         # Fetch OUI database
```

---

## Troubleshooting

### Weather shows "Configure WEATHERAPI_KEY"
Click the gear icon and add your API key, or set the `WEATHERAPI_KEY` environment variable.

### No network devices showing
The ARP cache only contains devices your computer has recently communicated with. Try pinging your router: `ping 192.168.1.1`

### Port already in use
```bash
# Find what's using port 5050
lsof -i :5050

# Kill it
kill -9 <PID>

# Or use a different port
python app.py --port 5051
```

### Icons not showing
Update Font Awesome or check your internet connection (icons load from CDN).

---

## Development

### Running Tests
```bash
pytest -v
```

### Data Files
Edit `data/prices.csv` or `data/quotes.json` to update content without restarting the app.

### Adding Themes
Modify `static/css/themes.css` and update `static/js/themes.js` with new theme definitions.

---

## Roadmap

- [ ] Docker containerization
- [ ] Historical data graphs (Chart.js)
- [ ] Alert system for critical metrics
- [ ] Export functionality (PDF/CSV)
- [ ] Windows .exe bundle
- [ ] Linux AppImage/Snap package

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Changelog

### v4.3.0 (Current)
- Added UI-based API key configuration (no manual `.env` needed)
- Added weather forecast flip card with hourly/daily views
- Added split-flap clock page
- Added weather refresh button
- Added rain chance indicators
- Improved accessibility (keyboard navigation, focus states)
- Added loading spinners and empty states
- Added reduced motion support
- Enhanced scrollbar styling

### v4.2.0
- Added full native macOS application bundle (NetHealth2025.app)
- Stabilized launcher script with proper Dock integration
- Removed PyInstaller dependency for cleaner build
- Cleaned root directory structure
- Added static/img/icons directory for better organization
- Port 5050 validation and cleanup steps
- Fixed Dock icon bounce issue
- Corrected root directory resolution inside `.app`
- Added internal logging to launch.log
- Improved CWD resolution and `.env` loading in app mode
- Works properly when moved to Applications folder

### v4.1.0
- Fixed duplicate device entries appearing for multi-interface hosts (e.g., en0/en13)
- Added IP-based deduplication with merged interface listings
- Sorted network device results by IP for consistent display
- Verified macOS/Linux/Windows compatibility

### v4.0.0
- Added theme toggle for dark/light mode with colored icons (blue moon, yellow sun)
- Added theme logo auto-swap using `MutationObserver`
- Fixed Font Awesome integrity hash blocking icons
- Fixed theme.js loading race condition
- Enhanced price ticker with drag-scroll interactivity
- Improved header blending, transitions, and theme responsiveness
- Added temperature-based color coding for weather icons
- Refined mobile responsiveness across all breakpoints

### v0.3.0
- Added network device discovery from ARP cache
- Integrated WeatherAPI.com for real weather data
- Improved MAC address vendor lookup with IEEE OUI database
- Added device type detection and classification
- Enhanced error handling for network requests

### v0.2.0
- Added argparse port selection (`--port` flag)
- Updated quotes database with new content
- Refined API structure and documentation
- Fixed various minor bugs and performance issues

### v0.1.0
- Initial release
- Basic dashboard with system metrics
- Theme system with 4 color palettes
- Typography picker
- Quote rotation system
- Price ticker functionality

---

## License

MIT License — see [LICENSE.md](LICENSE.md)

---

## Contact

- **School:** rigel.leonard31@bcmail.cuny.edu
**Personal** — rigel.leonard@gmail.com

---

**Star this repo if you find it helpful!**

[Back to Top](#nethealth-2025)
