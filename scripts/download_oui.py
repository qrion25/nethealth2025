#!/usr/bin/env python3
"""
Script to download the IEEE OUI database for MAC address vendor lookup.
Run this once to populate data/oui.txt
"""

import urllib.request
import ssl
from pathlib import Path

OUI_URL = "https://standards-oui.ieee.org/oui/oui.txt"
ROOT = Path(__file__).resolve().parents[1]  # Go up TWO levels to project root
DATA_DIR = ROOT / "data"
OUI_FILE = DATA_DIR / "oui.txt"

def download_oui_database():
    """Download the IEEE OUI database."""
    print("Downloading IEEE OUI database...")
    print(f"URL: {OUI_URL}")
    
    DATA_DIR.mkdir(exist_ok=True)
    
    try:
        # Bypass SSL verification for macOS
        ssl._create_default_https_context = ssl._create_unverified_context
        urllib.request.urlretrieve(OUI_URL, OUI_FILE)
        print(f"✓ Successfully downloaded to: {OUI_FILE}")
        print(f"  File size: {OUI_FILE.stat().st_size:,} bytes")
    except Exception as e:
        print(f"✗ Error downloading OUI database: {e}")
        print("\nAlternative: Manually download from:")
        print(f"  {OUI_URL}")
        print(f"  and save to: {OUI_FILE}")
        return False
    
    return True

if __name__ == "__main__":
    success = download_oui_database()
    exit(0 if success else 1)