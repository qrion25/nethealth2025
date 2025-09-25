NetHealth2025

NetHealth2025 is a Flask-based dashboard project built for CISC 4900 (Senior Capstone).
It combines a visually interactive dashboard (local weather, inspirational quotes, grocery price tracker, themes, and typography experiments) with backend extensibility for future health-network features.

⸻

Project Structure
'''
NetHealth2025/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── README.md           # Project documentation
├── static/             # CSS, JS, and images
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── templates/
    └── index.html      # Dashboard template
'''

⸻

Setup Instructions

1. Clone or download the project

git clone <your-repo-url>
cd NetHealth2025

2. Create and activate a virtual environment

python3 -m venv .venv
source .venv/bin/activate

3. Install dependencies

pip install -r requirements.txt

4. Run the app

Option A: via Flask runner

# from project root
source .venv/bin/activate           # if not already active
export FLASK_APP=app.py
python app.py
# visit http://127.0.0.1:5001/

Option B: directly

python app.py

5. Open in browser

Visit:

http://127.0.0.1:5001


⸻

Features
	•	Local Conditions (time, weather placeholder)
	•	System Status (battery, memory, network info)
	•	Inspiration Corner (rotating quotes)
	•	Grocery Prices Tracker (fun “What’s with these prices?” ticker, with future DB/CSV integration)
	•	Themes and Fonts (dark/light mode, typography selector, future split-flap style)
	•	Mini Calendar
	•	Market Watch (simulated data for now)

⸻

Roadmap
	•	Backend CSV/DB integration for grocery prices with price change indicators.
	•	OUI MAC address translations for network health experiments.
	•	Multiple theme packs (colors, fonts, background effects).
	•	Expanded NetHealth metrics and healthcare-related data visualization.

⸻

Requirements
	•	Python 3.10+
	•	Flask 3.x

⸻

Credits

Built by Rigel Leonard for NetHealth2025 (CISC 4900 Capstone).
Frontend styling inspired by portfolio dashboard prototypes.

