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
    """
    Load OUI (Organizationally Unique Identifier) database.
    Maps MAC address prefixes to manufacturer names.
    
    File format expected (IEEE standard):
    00-00-0C   (hex)		Cisco Systems, Inc
    """
    oui_map = {}
    
    if not OUI_FILE.exists():
        return oui_map
    
    try:
        with OUI_FILE.open('r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                # Parse IEEE OUI format: "XX-XX-XX   (hex)		Company Name"
                match = re.match(r'^([0-9A-Fa-f]{2})-([0-9A-Fa-f]{2})-([0-9A-Fa-f]{2})\s+\(hex\)\s+(.+)$', line)
                if match:
                    prefix = f"{match.group(1)}:{match.group(2)}:{match.group(3)}".upper()
                    vendor = match.group(4).strip()
                    oui_map[prefix] = vendor
    except Exception as e:
        print(f"Error loading OUI database: {e}")
    
    return oui_map

# Load OUI database once at module level
OUI_DATABASE = load_oui_database()

def lookup_vendor(mac_address: str) -> str:
    """
    Look up vendor name from MAC address using OUI database.
    
    Args:
        mac_address: MAC address in format XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
    
    Returns:
        Vendor name or "Unknown Vendor"
    """
    if not mac_address:
        return "Unknown Vendor"
    
    # Normalize MAC address format
    mac_clean = mac_address.replace('-', ':').replace('.', ':').upper()
    
    # Extract first 3 octets (OUI prefix) and zero-pad each octet to 2 digits
    parts = mac_clean.split(':')
    if len(parts) < 3:
        return "Unknown Vendor"
    
    # Zero-pad each octet to 2 digits
    prefix = ':'.join(part.zfill(2) for part in parts[:3])
    
    return OUI_DATABASE.get(prefix, "Unknown Vendor")

def _should_skip_device(ip: str, mac: str) -> bool:
    """
    Determine if a device should be filtered out from the list.
    Skips broadcast, multicast, and special addresses.
    
    Args:
        ip: IP address
        mac: MAC address
    
    Returns:
        True if device should be skipped, False otherwise
    """
    # Skip broadcast MAC
    if mac.lower() == 'ff:ff:ff:ff:ff:ff':
        return True
    
    # Skip multicast MACs (first octet has LSB set in first byte)
    first_octet = mac.split(':')[0]
    try:
        if int(first_octet, 16) & 0x01:  # Multicast bit set
            return True
    except ValueError:
        pass
    
    # Skip multicast IPs (224.0.0.0/4)
    ip_parts = ip.split('.')
    if len(ip_parts) == 4:
        try:
            first_octet_ip = int(ip_parts[0])
            # Multicast range: 224-239
            if 224 <= first_octet_ip <= 239:
                return True
            # Broadcast address (ends in .255)
            if ip_parts[3] == '255':
                return True
            # Link-local (169.254.x.x)
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
            lines = f.readlines()[1:]  # Skip header
            
            for line in lines:
                parts = line.split()
                if len(parts) >= 6:
                    ip = parts[0]
                    mac = parts[3]
                    interface = parts[5]
                    
                    # Skip incomplete entries
                    if mac == '00:00:00:00:00:00' or mac == '<incomplete>':
                        continue
                    
                    # Filter out broadcast/multicast
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
        
        # Format: hostname (192.168.1.1) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]
        # Also handles: ? (192.168.1.1) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]
        pattern = r'\(([0-9.]+)\)\s+at\s+([0-9a-f:]+)\s+on\s+(\S+)'
        
        for line in result.stdout.splitlines():
            # Skip incomplete entries
            if '(incomplete)' in line.lower():
                continue
                
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                ip = match.group(1)
                mac = match.group(2)
                interface = match.group(3)
                
                # Filter out broadcast, multicast, and special addresses
                if _should_skip_device(ip, mac):
                    continue
                
                devices.append({
                    'ip': ip,
                    'mac': mac,
                    'vendor': lookup_vendor(mac),
                    'interface': interface
                })
    except subprocess.TimeoutExpired:
        print(f"Error: arp command timed out after 15 seconds")
    except Exception as e:
        print(f"Error running arp command: {e}")
    
    return devices

def parse_arp_cache_windows() -> List[Dict[str, str]]:
    """Parse arp -a output on Windows."""
    devices = []
    
    try:
        result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=5)
        
        # Format: 192.168.1.1          aa-bb-cc-dd-ee-ff     dynamic
        pattern = r'\s+([0-9.]+)\s+([0-9a-f-]+)\s+\w+'
        
        for line in result.stdout.splitlines():
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                ip = match.group(1)
                mac = match.group(2).replace('-', ':')
                
                # Filter out broadcast/multicast
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

def get_network_devices() -> List[Dict[str, str]]:
    """
    Get list of devices from ARP cache (cross-platform).
    
    Returns:
        List of dicts with keys: ip, mac, vendor, interface
    """
    system = platform.system()
    
    if system == 'Linux':
        return parse_arp_cache_linux()
    elif system == 'Darwin':  # macOS
        return parse_arp_cache_macos()
    elif system == 'Windows':
        return parse_arp_cache_windows()
    else:
        return []

def guess_device_type(vendor: str, mac: str) -> str:
    """
    Make an educated guess about device type based on vendor.
    
    Args:
        vendor: Vendor name from OUI lookup
        mac: MAC address
    
    Returns:
        Device type guess (e.g., "Router", "Phone", "Computer")
    """
    vendor_lower = vendor.lower()
    
    # Routers and networking equipment
    if any(x in vendor_lower for x in ['cisco', 'netgear', 'tp-link', 'linksys', 'asus router', 'd-link', 'ubiquiti', 'unifi']):
        return 'Router/AP'
    
    # TVs and streaming devices
    if any(x in vendor_lower for x in ['lg', 'samsung tv', 'sony tv', 'vizio', 'arcadyan', 'roku', 'chromecast', 'amazon fire']):
        return 'TV/Streaming'
    
    # Mobile devices
    if any(x in vendor_lower for x in ['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'oneplus', 'oppo']):
        return 'Mobile Device'
    
    # Computers
    if any(x in vendor_lower for x in ['dell', 'hp', 'lenovo', 'microsoft', 'asus computer', 'acer', 'msi', 'intel']):
        return 'Computer'
    
    # IoT and smart devices
    if any(x in vendor_lower for x in ['philips', 'sonos', 'nest', 'ring', 'ecobee', 'wyze', 'espressif']):
        return 'Smart Device'
    
    # Gaming consoles
    if any(x in vendor_lower for x in ['sony', 'nintendo', 'microsoft xbox']):
        return 'Gaming Console'
    
    # Printers
    if any(x in vendor_lower for x in ['canon', 'epson', 'brother', 'xerox']):
        return 'Printer'
    
    # Default
    return 'Unknown'