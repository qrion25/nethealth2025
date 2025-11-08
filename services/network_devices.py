# services/network_devices.py
from __future__ import annotations
import re
import subprocess
import platform
from pathlib import Path
from typing import List, Dict, Optional

# Path to OUI database
ROOT = Path(__file__).resolve().parents[1]
OUI_FILE = ROOT / "data" / "oui.txt"


def load_oui_database() -> Dict[str, str]:
    """Load OUI (Organizationally Unique Identifier) database."""
    oui_map = {}
    if not OUI_FILE.exists():
        return oui_map

    try:
        with OUI_FILE.open('r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                match = re.match(
                    r'^([0-9A-Fa-f]{2})-([0-9A-Fa-f]{2})-([0-9A-Fa-f]{2})\s+\(hex\)\s+(.+)$', line)
                if match:
                    prefix = f"{match.group(1)}:{match.group(2)}:{match.group(3)}".upper()
                    vendor = match.group(4).strip()
                    oui_map[prefix] = vendor
    except Exception as e:
        print(f"Error loading OUI database: {e}")

    return oui_map


OUI_DATABASE = load_oui_database()


def lookup_vendor(mac_address: str) -> str:
    """Look up vendor name from MAC address using OUI database."""
    if not mac_address:
        return "Unknown Vendor"

    mac_clean = mac_address.replace('-', ':').replace('.', ':').upper()
    parts = mac_clean.split(':')
    if len(parts) < 3:
        return "Unknown Vendor"

    prefix = ':'.join(part.zfill(2) for part in parts[:3])
    return OUI_DATABASE.get(prefix, "Unknown Vendor")


def _should_skip_device(ip: str, mac: str) -> bool:
    """Filter out broadcast, multicast, and special addresses."""
    if mac.lower() == 'ff:ff:ff:ff:ff:ff':
        return True

    first_octet = mac.split(':')[0]
    try:
        if int(first_octet, 16) & 0x01:
            return True
    except ValueError:
        pass

    ip_parts = ip.split('.')
    if len(ip_parts) == 4:
        try:
            first_octet_ip = int(ip_parts[0])
            if 224 <= first_octet_ip <= 239 or ip_parts[3] == '255':
                return True
            if first_octet_ip == 169 and ip_parts[1] == '254':
                return True
        except ValueError:
            pass

    return False


def parse_arp_cache_linux() -> List[Dict[str, str]]:
    """Parse /proc/net/arp on Linux systems."""
    devices = []
    arp_file = Path('/proc/net/arp')
    if not arp_file.exists():
        return devices

    try:
        with arp_file.open('r') as f:
            lines = f.readlines()[1:]
            for line in lines:
                parts = line.split()
                if len(parts) >= 6:
                    ip = parts[0]
                    mac = parts[3]
                    interface = parts[5]
                    if mac in ['00:00:00:00:00:00', '<incomplete>']:
                        continue
                    if _should_skip_device(ip, mac):
                        continue
                    devices.append({
                        'ip': ip,
                        'mac': mac,
                        'vendor': lookup_vendor(mac),
                        'interface': interface
                    })
    except Exception as e:
        print(f"Error parsing ARP cache: {e}")

    return devices


def parse_arp_cache_macos() -> List[Dict[str, str]]:
    """Parse arp -a output on macOS."""
    devices = []
    try:
        result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=15)
        pattern = r'\(([0-9.]+)\)\s+at\s+([0-9a-f:]+)\s+on\s+(\S+)'
        for line in result.stdout.splitlines():
            if '(incomplete)' in line.lower():
                continue
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                ip = match.group(1)
                mac = match.group(2)
                interface = match.group(3)
                if _should_skip_device(ip, mac):
                    continue
                devices.append({
                    'ip': ip,
                    'mac': mac,
                    'vendor': lookup_vendor(mac),
                    'interface': interface
                })
    except subprocess.TimeoutExpired:
        print("Error: arp command timed out after 15 seconds")
    except Exception as e:
        print(f"Error running arp command: {e}")

    return devices


def parse_arp_cache_windows() -> List[Dict[str, str]]:
    """Parse arp -a output on Windows."""
    devices = []
    try:
        result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=5)
        pattern = r'\s+([0-9.]+)\s+([0-9a-f-]+)\s+\w+'
        for line in result.stdout.splitlines():
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                ip = match.group(1)
                mac = match.group(2).replace('-', ':')
                if _should_skip_device(ip, mac):
                    continue
                devices.append({
                    'ip': ip,
                    'mac': mac,
                    'vendor': lookup_vendor(mac),
                    'interface': 'N/A'
                })
    except Exception as e:
        print(f"Error running arp command: {e}")

    return devices


# ✅ Deduplicate devices by IP, merging interfaces if needed
def deduplicate_devices(devices: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Remove duplicate devices that appear on multiple interfaces.
    If duplicates are found, their interfaces are merged (e.g., 'en0, en13').
    """
    merged = {}
    for d in devices:
        ip = d.get("ip")
        if not ip:
            continue
        if ip in merged:
            existing_iface = merged[ip].get("interface", "")
            new_iface = d.get("interface", "")
            if new_iface and new_iface not in existing_iface:
                merged[ip]["interface"] = f"{existing_iface}, {new_iface}".strip(", ")
        else:
            merged[ip] = d
    return list(merged.values())


def get_network_devices() -> List[Dict[str, str]]:
    """Get list of devices from ARP cache (cross-platform)."""
    system = platform.system()
    if system == 'Linux':
        devices = parse_arp_cache_linux()
    elif system == 'Darwin':  # macOS
        devices = parse_arp_cache_macos()
    elif system == 'Windows':
        devices = parse_arp_cache_windows()
    else:
        devices = []

    # Deduplicate by IP across all interfaces
    devices = deduplicate_devices(devices)

    # Sort by IP for consistent UI ordering
    devices.sort(key=lambda d: tuple(int(x) for x in d["ip"].split('.')) if "ip" in d else ())

    # Guess device type for UI labeling
    for d in devices:
        d["device_type"] = guess_device_type(d.get("vendor", ""), d.get("mac", ""))

    return devices


def guess_device_type(vendor: str, mac: str) -> str:
    """Guess device type from vendor name."""
    vendor_lower = vendor.lower()

    if any(x in vendor_lower for x in ['cisco', 'netgear', 'tp-link', 'linksys', 'asus router', 'd-link', 'ubiquiti', 'unifi']):
        return 'Router/AP'
    if any(x in vendor_lower for x in ['lg', 'samsung tv', 'sony tv', 'vizio', 'arcadyan', 'roku', 'chromecast', 'amazon fire']):
        return 'TV/Streaming'
    if any(x in vendor_lower for x in ['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'oneplus', 'oppo']):
        return 'Mobile Device'
    if any(x in vendor_lower for x in ['dell', 'hp', 'lenovo', 'microsoft', 'asus computer', 'acer', 'msi', 'intel']):
        return 'Computer'
    if any(x in vendor_lower for x in ['philips', 'sonos', 'nest', 'ring', 'ecobee', 'wyze', 'espressif']):
        return 'Smart Device'
    if any(x in vendor_lower for x in ['sony', 'nintendo', 'microsoft xbox']):
        return 'Gaming Console'
    if any(x in vendor_lower for x in ['canon', 'epson', 'brother', 'xerox']):
        return 'Printer'

    return 'Unknown'