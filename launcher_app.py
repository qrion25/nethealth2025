#!/usr/bin/env python3
"""
Universal Launcher for NetHealth2025
------------------------------------
Works on macOS, Windows, and Linux.

Responsibilities:
- Detect OS
- Locate project root
- Create venv if missing
- Install requirements
- Launch Flask server
- Open browser automatically
- macOS: supports .app bundle wrapping
"""

import os
import sys
import subprocess
import platform
import webbrowser
from pathlib import Path
import time


# -------------------------------------------------
# 1. Resolve project root (works inside macOS .app)
# -------------------------------------------------
def resolve_project_root():
    current = Path(__file__).resolve()

    # macOS .app bundle case
    if ".app/Contents" in str(current):
        return current.parents[3]

    # Normal dev / Windows / Linux
    return current.parent


PROJECT_ROOT = resolve_project_root()
print(f"[launcher] PROJECT_ROOT: {PROJECT_ROOT}")

os.chdir(PROJECT_ROOT)


# -------------------------------------------------
# 2. Virtual environment setup
# -------------------------------------------------
VENV_DIR = PROJECT_ROOT / ".venv"
PYTHON = None  # set after activation


def ensure_venv():
    if not VENV_DIR.exists():
        print("[launcher] Creating virtual environment…")
        subprocess.run([sys.executable, "-m", "venv", str(VENV_DIR)], check=True)
    else:
        print("[launcher] Virtual environment already exists.")


def activate_venv():
    global PYTHON

    system = platform.system()

    if system == "Windows":
        PYTHON = str(VENV_DIR / "Scripts" / "python.exe")
    else:
        PYTHON = str(VENV_DIR / "bin" / "python3")

    print(f"[launcher] Using Python in venv: {PYTHON}")


# -------------------------------------------------
# 3. Install dependencies
# -------------------------------------------------
def install_requirements():
    req = PROJECT_ROOT / "requirements.txt"
    if not req.exists():
        print("[launcher] No requirements.txt found.")
        return

    print("[launcher] Installing requirements…")
    subprocess.run([PYTHON, "-m", "pip", "install", "-r", str(req)], check=True)


# -------------------------------------------------
# 4. Launch Flask app
# -------------------------------------------------
def launch_flask():
    print("[launcher] Starting Flask app…")

    process = subprocess.Popen(
        [PYTHON, "app.py"],
        cwd=str(PROJECT_ROOT)
    )

    # Wait briefly so server can start
    time.sleep(1.5)

    # On all OS: open browser
    webbrowser.open("http://127.0.0.1:5050")

    return process


# -------------------------------------------------
# 5. Main Routine
# -------------------------------------------------
def main():
    print("[launcher] ===== NetHealth2025 Launcher =====")

    ensure_venv()
    activate_venv()
    install_requirements()

    process = launch_flask()

    print("[launcher] Flask launched. Press Ctrl+C to quit.")
    try:
        process.wait()
    except KeyboardInterrupt:
        print("[launcher] Shutting down…")
        process.terminate()


if __name__ == "__main__":
    main()