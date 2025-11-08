# NetHealth 2025

![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.1-lightgrey.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)

NetHealth 2025 is a lightweight system and environment dashboard built with **Flask**, **HTML/CSS**, and **JavaScript**.  
It's designed as a sandbox project to demonstrate real-time updates of system health, local conditions, inspirational content, network device discovery, and price tracking—all within a single responsive web dashboard.

---

## Live Demo & Features Preview

![NetHealth Dashboard](static/img/nh_theme_light.png)

**Try it yourself:** Clone and run in under 2 minutes!

---

## Table of Contents

- [What's New (v0.4.0)](#whats-new-v040)
- [Why NetHealth?](#why-nethealth)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Quick Start (TL;DR)](#quick-start-tldr)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Network Device Discovery](#network-device-discovery)
- [Development Notes](#development-notes)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [Contact](#contact)
- [License](#license)

---

## What's New (v0.4.0)

### Refined Header System
- **Transparent blurred header** with smooth light/dark transitions
- **Responsive brand layout** with subtle hover scaling
- **Unified border fade** and theme-aware background blending using `color-mix()`
- **Colored theme toggle icons** - Deep blue moon (light mode) and warm yellow sun (dark mode)

### Theme Toggle + Logo Auto-Swap
- Added **theme toggle button** for instant light/dark mode switching
- **Automatic logo swapping** using `MutationObserver` to detect theme changes
- Works seamlessly with transparent PNGs or separate light/dark assets:
  ```html
  <img 
    class="theme-logo"
    data-light="/static/img/nethealth2025_logo.png"
    data-dark="/static/img/nethealth2025_logo_dark.png"
  />
  ```

### Interactive Price Ticker
- **Slower, smoother scrolling** animation (75s duration)
- **Drag to pause** / swipe on mobile for manual control
- Fully **touch-friendly** and auto-resumes on release
- Visual feedback with cursor changes and smooth hover effects

### Improved Theme Responsiveness
- Subtle **transitions between light/dark modes**
- Refined **background and border blending** for modern browsers
- Polished **accent consistency** across icons, pills, and text
- **Enhanced weather icon colors** with temperature-based color mapping

### Bug Fixes
- **Fixed Font Awesome integrity mismatch** causing icons to block
- Resolved intermittent `AbortError` during network device polling
- **Fixed theme.js loading race condition** preventing toggle icons from appearing
- Minor animation and accessibility refinements

---

## Why NetHealth?

NetHealth 2025 is perfect for:

- **System administrators** monitoring local infrastructure
- **Developers** learning Flask + modern web dashboard design  
- **Homelab enthusiasts** tracking network devices and system metrics
- **Students** studying real-time web applications and API design

Built with simplicity in mind—no heavy frameworks, just Flask, vanilla JavaScript, and clean CSS.

---

## Features

### Customization
- **Dark/Light Mode + 4 Color Themes** (NetHealth, Sunset, Forest, Terminal)
- **Theme-Aware Branding** - Logo auto-swaps based on active theme
- **Live Typography Picker** - Switch between Inter, Playfair Display, Monospace, and System UI fonts in real-time
- **Colored Toggle Icons** - Visual feedback with themed moon/sun icons

### Local Conditions
- Real-time weather via [WeatherAPI.com](https://www.weatherapi.com/)
- Automatic location detection via IP geolocation
- **Temperature display** with color-coded weather icons
- **Outfit suggestions** based on current temperature
- Local time display with auto-update

### System Monitoring (Hybrid)
- **Browser Status**: Battery level, tab memory usage, network connectivity, response time
- **Server Status**: CPU info, RAM usage, storage capacity, system uptime, network interface details
- **Cross-platform support** (macOS, Linux, Windows) via `psutil`
- **Real-time metrics** with visual progress bars and color-coded indicators

### Network Discovery
- **Auto-detect devices** on your local network from ARP cache
- **MAC address vendor lookup** using IEEE OUI database
- **Device type identification** (Router, Mobile, Computer, Smart Device, Gaming Console, etc.)
- **Auto-refresh every 2 minutes** with manual refresh option
- Cross-platform support (macOS, Linux, Windows)

### Content Widgets
- **Inspiration Corner**: Rotating motivational quotes with smooth fade animations
- **Manual refresh button** with spinning animation
- **Price Tracker**: Real-time grocery price monitoring with trend indicators (▲ up, ▼ down, — flat)
- **Interactive ticker** with drag-to-scroll functionality

---

## Prerequisites

Before you begin, ensure you have:

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))
- **WeatherAPI Key** (optional, free at [weatherapi.com](https://www.weatherapi.com/signup.aspx))

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/qrion25/nethealth2025.git
cd nethealth2025
```

### 2. Create a virtual environment

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**Windows (CMD):**
```cmd
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Download OUI database

This is required for network device vendor lookup:

```bash
python scripts/download_oui.py
```

*Note: Since you're in a virtual environment, `python` works on all platforms.*

### 5. Set up Weather API (Optional, but Recommended)

Sign up for a free account at [WeatherAPI.com](https://www.weatherapi.com/signup.aspx) and get your API key.

**macOS / Linux:**
```bash
export WEATHERAPI_KEY='your_api_key_here'
export WEATHER_LOCATION='New York City'  # Optional, defaults to auto IP detection
```

**Windows (PowerShell):**
```powershell
$env:WEATHERAPI_KEY='your_api_key_here'
$env:WEATHER_LOCATION='New York City'
```

**Windows (CMD):**
```cmd
set WEATHERAPI_KEY=your_api_key_here
set WEATHER_LOCATION=New York City
```

To confirm environment variables are set:
- **macOS / Linux:** `echo $WEATHERAPI_KEY`
- **Windows (CMD):** `echo %WEATHERAPI_KEY%`
- **Windows (PowerShell):** `echo $env:WEATHERAPI_KEY`

### 6. Troubleshooting: "No module named 'dotenv'" error

If you encounter this error, install python-dotenv:

```bash
pip install python-dotenv
```

Verify installation:
```bash
pip show python-dotenv
```

### 7. Optional: Using a .env file (Recommended)

Instead of setting environment variables manually each time, create a `.env` file in your project root:

```
WEATHERAPI_KEY=your_api_key_here
WEATHER_LOCATION=New York City
```

The app will automatically load this file when running. **Don't forget to add `.env` to your `.gitignore` file.**

### 8. Run the app

```bash
python app.py
```

By default, the app runs on port **5050**.  
Open [http://127.0.0.1:5050](http://127.0.0.1:5050) in your browser.

You can specify a custom port:
```bash
python app.py --port 5051
```

---

## Quick Start (TL;DR)

### macOS / Linux:
```bash
git clone https://github.com/qrion25/nethealth2025.git
cd nethealth2025
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/download_oui.py
export WEATHERAPI_KEY='your_key'
python app.py
```
### Or even faster, if you’ve already installed everything:
```bash
source .venv/bin/activate
python app.py
```

### Windows (PowerShell):
```powershell
git clone https://github.com/qrion25/nethealth2025.git
cd nethealth2025
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python scripts/download_oui.py
$env:WEATHERAPI_KEY='your_key'
python app.py
```

### Already Set Up on macOS?

If you've already installed everything:

```bash
source .venv/bin/activate
python app.py
```

That's it—open [http://127.0.0.1:5050](http://127.0.0.1:5050) in your browser!

---

## Project Structure

```
NetHealth2025/
├── api/
│   ├── __init__.py
│   └── routes.py              # Defines all API endpoints
├── app.py                      # Flask entrypoint
├── README.md                   # Project documentation
├── requirements.txt            # Python dependencies
├── data/
│   ├── prices.csv              # CSV input for price ticker
│   ├── quotes.json             # JSON input for inspirational quotes
│   └── oui.txt                 # IEEE OUI database for MAC lookup
├── services/
│   ├── __init__.py
│   ├── system_info.py          # Cross-platform system metrics
│   └── network_devices.py      # Network device discovery from ARP cache
├── static/
│   ├── css/
│   │   ├── main.css            # Base styles
│   │   └── themes.css          # Theme overrides + dark mode
│   ├── js/
│   │   ├── dashboard.js        # Client-side dashboard logic
│   │   └── themes.js           # Theme/font handling logic
│   └── img/                    # Logos + screenshots
├── templates/
│   └── index.html              # Dashboard HTML (Jinja2 template)
├── scripts/
│   ├── dev_run.sh              # Helper script for local dev
│   └── download_oui.py         # Fetch IEEE OUI database
└── tests/
    ├── conftest.py             # Pytest configuration
    └── test_system_info.py     # Unit test for system_info service
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/health` | Health check (`{"ok": true}`) |
| `/api/version` | App version info |
| `/api/quotes` | Returns list of inspirational quotes |
| `/api/prices` | Returns price list with computed deltas |
| `/api/weather` | Returns current weather data from WeatherAPI.com |
| `/api/system` | Returns system information (CPU, memory, storage, uptime, network) |
| `/api/network/devices` | Returns discovered network devices from ARP cache |

---

## Configuration

### Weather API (Optional)

Without a WeatherAPI key, the dashboard will show placeholder weather data.

**To enable real weather:**

1. Sign up at [https://www.weatherapi.com/signup.aspx](https://www.weatherapi.com/signup.aspx)
2. Get your free API key (1 million calls/month)
3. Set environment variable: 
   - macOS/Linux: `export WEATHERAPI_KEY='your_key'`
   - Windows: `$env:WEATHERAPI_KEY='your_key'` (PowerShell) or `set WEATHERAPI_KEY=your_key` (CMD)
4. Optionally specify location:
   - macOS/Linux: `export WEATHER_LOCATION='Brooklyn'`
   - Windows: `$env:WEATHER_LOCATION='Brooklyn'` (PowerShell)

### Using a .env file (Recommended)

For persistent configuration, create a `.env` file in the project root:

```env
WEATHERAPI_KEY=your_api_key_here
WEATHER_LOCATION=New York City
```

**Add to your `.gitignore`:**
```
.env
```

The app will automatically load environment variables from this file using `python-dotenv`.

**Ensure your `app.py` includes at the top:**
```python
from dotenv import load_dotenv
load_dotenv()
```

---

## Network Device Discovery

The dashboard discovers devices on your local network by reading the system's ARP cache.

### Features:
- Cross-platform support (macOS, Linux, Windows)
- **Vendor identification** via IEEE OUI database
- **Device type detection** (Router, Mobile Device, Computer, Smart Device, Gaming Console, Printer, etc.)
- **Filters out broadcast/multicast** addresses
- **Auto-refreshes every 2 minutes**

### Note:
You'll only see devices your computer has recently communicated with. To populate the ARP cache, access other devices on your network:

```bash
# Example: Ping your router
ping 192.168.1.1

# Or visit a device's web interface
# Then refresh the dashboard
```

---

## Development Notes

- **Static assets** are served via `static/`. Add new CSS or JS files here.
- **Templates** use Jinja2 (`templates/index.html`) and reference Flask's `url_for` for assets.
- **Data files** (`prices.csv`, `quotes.json`) can be edited manually to update the dashboard **without restarting the app**.
- **Themes & Fonts** are handled by `themes.css` + `themes.js`.
- **System metrics** use `psutil` for cross-platform support (macOS, Linux, Windows).
- **Network device discovery** reads from the OS ARP cache (no special permissions required).
- **MAC address vendor lookup** uses the IEEE OUI database (`data/oui.txt`).
- **JavaScript modules**:
  - `themes.js` loads **without defer** to ensure proper initialization
  - `dashboard.js` loads **with defer** to wait for DOM and theme system
- **Font Awesome** is loaded from CDN with integrity hash for security

---

## Testing

Unit tests are included for the system information service.

**Run tests with:**

```bash
pytest -v
```

**Test coverage:**
- System information service (`services/system_info.py`)
- Cross-platform compatibility
- API endpoint responses

---

## Troubleshooting

### Icons not showing?

**Problem:** Font Awesome CSS blocked due to integrity hash mismatch.

**Solution:** Update Font Awesome link to latest stable version:

```html
<link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
      integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer" />
```

**Alternative:** Remove the integrity check entirely:

```html
<link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
      crossorigin="anonymous"
      referrerpolicy="no-referrer" />
```

### Theme toggle icons not appearing?

**Problem:** `themes.js` loading race condition with `dashboard.js`.

**Solution:** Ensure proper script loading order in `index.html`:

```html
<!-- Load themes.js first WITHOUT defer -->
<script src="{{ url_for('static', filename='js/themes.js') }}"></script>
<!-- Load dashboard.js second WITH defer -->
<script defer src="{{ url_for('static', filename='js/dashboard.js') }}"></script>
```

### No network devices showing?

**Problem:** ARP cache only contains devices your computer has recently communicated with.

**Solutions:**
1. Ping devices on your network: `ping 192.168.1.1` (your router's IP)
2. Browse to device web interfaces (e.g., router admin panel)
3. Wait a moment and refresh the dashboard
4. On some systems, you may need to scan: `arp -a` (to view current ARP cache)

### Weather shows "Configure WEATHERAPI_KEY"?

**Problem:** Weather API key not configured.

**Solutions:**
- Set the environment variable: `export WEATHERAPI_KEY='your_key'` (macOS/Linux)
- Or add it to a `.env` file (see Configuration section)
- Restart the app after setting the key

### Weather location is incorrect?

**Problem:** Auto IP detection may not be accurate.

**Solution:** Specify your location explicitly:
```bash
export WEATHER_LOCATION='Your City'
```

Or in `.env`:
```
WEATHER_LOCATION=Brooklyn
```

### "No module named 'dotenv'" error?

**Problem:** `python-dotenv` not installed.

**Solution:**
```bash
pip install python-dotenv
```

### Port already in use?

**Problem:** Port 5050 is already occupied.

**Solution:** Run on a different port:
```bash
python app.py --port 5051
```

---

## Screenshots

### Light & Dark Themes

**Light Mode:**
![NetHealth Light](static/img/nh_theme_light.png)

**Dark Mode:**
![NetHealth Dark](static/img/nh_theme_dark.png)

### Additional Themes

**Sunset Theme:**
![Sunset](static/img/sunset_theme_light.png)

**Forest Theme:**
![Forest](static/img/forest_theme_light.png)

**Terminal Theme:**
![Terminal](static/img/terminal_theme_light.png)

---

## Roadmap

Future enhancements planned for NetHealth 2025:

- [ ] **Docker containerization** for easy deployment
- [ ] **Historical data graphs** with Chart.js integration
- [ ] **Mobile app companion** (React Native or Flutter)
- [ ] **Plugin system** for custom widgets
- [ ] **Multi-language support** (i18n)
- [ ] **User authentication** and multi-user support
- [ ] **Alert system** for critical metrics
- [ ] **Export functionality** for reports (PDF/CSV)
- [ ] **Customizable refresh intervals** per widget
- [ ] **Dark mode scheduling** (auto-switch based on time)

---

## Contributing

Contributions are welcome! Whether it's bug fixes, new features, or documentation improvements, your help is appreciated.

### How to Contribute:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Guidelines:

- Ensure all tests pass: `pytest -v`
- Follow existing code style and conventions
- Update documentation for new features
- Add tests for new functionality
- Keep commits focused and descriptive

---

## Changelog

### v0.4.0 (Current)
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

## Contact

**Rigel Leonard**
- **Personal:** rigel.leonard@gmail.com
- **School:** rigel.leonard31@bcmail.cuny.edu

Feel free to reach out with questions, suggestions, or feedback!

---

## License

This project is licensed under the **MIT License**.

See [LICENSE.md](LICENSE.md) for full details.

---

## Acknowledgments

- **Flask** - Lightweight Python web framework
- **WeatherAPI.com** - Weather data provider
- **Font Awesome** - Icon library
- **psutil** - Cross-platform system metrics
- **IEEE** - OUI database for MAC address vendor lookup

---

**If you find this project helpful, please consider giving it a star on GitHub!**

[Back to Top](#nethealth-2025)