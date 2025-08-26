# NetHealth 2025

## Overview
NetHealth 2025 is a lightweight, browser-based system dashboard designed to run locally on a Raspberry Pi, Windows PC, or macOS computer.  
It provides live system statistics (CPU, memory, disk, uptime, network) and local network insights through a simple Flask web interface.  

**CISC 4900 (Fall 2025)** — NetHealth 2025 is a course project for Brooklyn College. It demonstrates the use of Python and Flask to build a cross-platform **system & LAN dashboard** that runs locally (Raspberry Pi, macOS, Windows).  

Features include live system stats (CPU, memory, disk, uptime, network) and LAN device discovery via ARP.

---

## Features
- Real-time system monitoring (CPU load, temperature*, memory, disk usage, uptime, network)
- Local network scan using ARP to detect nearby devices
- Web dashboard accessible via browser

*Temperature may be "N/A" on macOS/Windows due to API limitations.

---

## Setup Instructions

### macOS / Linux / Raspberry Pi
git clone https://github.com/qrion25/NetHealth2025
cd NetHealth2025
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py

Then open http://127.0.0.1:5000
If port 5000 is busy, edit `app.py` and change:
app.run(host="0.0.0.0", port=5000, debug=True)

→ to another port (e.g., 5001), then open http://127.0.0.1:5001

### Windows (PowerShell)
git clone https://github.com/qrion25/NetHealth2025
cd NetHealth2025
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
python app.py

Then open http://127.0.0.1:5000 
If port 5000 is busy, edit `app.py` and change:
app.run(host="0.0.0.0", port=5000, debug=True)

→ to another port (e.g., 5001), then open http://127.0.0.1:5001

---

## Known Platform Differences
- Raspberry Pi → Full feature support (temperature, ARP scan, system stats).  
- macOS → All features except temperature (usually "N/A").  
- Windows → System stats work; ARP scan may be limited; temperature usually unavailable.  

---

## Deliverables (for CISC 4900)
1. Flask web application with monitoring + ARP scanning  
2. Responsive dashboard interface  
3. GitHub repository with commits and project board  
4. Final written report and demo  

---

## How It Works
- Flask serves system stats through REST API endpoints (`/api/status`, `/api/devices`).  
- The frontend (HTML/CSS/JS) fetches this data and updates the dashboard in real time.

---

## Directory Structure (for CISC 4900)
```
NetHealth2025
├── api
│   ├── __init__.py
│   └── routes.py          # API endpoints (/status, /devices, etc.)
├── app.py                  # Flask entrypoint
├── README.md               # Documentation (this file)
├── requirements.txt        # Python dependencies
├── services
│   ├── __init__.py
│   └── system_info.py      # Cross-platform system metrics collection
├── static
│   └── main.css            # Stylesheet
├── templates
│   └── index.html          # Frontend HTML
└── tests                   # Placeholder for unit tests
```

---
## Screenshots
![NetHealth2025 V1 Screenshot](https://github.com/user-attachments/assets/a9aee068-86b8-4864-8140-e93560f42178)

---

## Future Work
- Add dark/light mode toggle
- Host via domain (nethealth2025.com) with local client integration
- Expand device identification beyond ARP

## Supervisor
Professor R. Zwick – Brooklyn College  

## Student
Rigel Leonard  
Fall 2025 – CISC 4900  
Email: rigel.leonard31@bcmail.cuny.edu / rigel.leonard@gmail.com

## License
This project is licensed under the MIT License – see the LICENSE file for details.

## Badges
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0-lightgrey.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
