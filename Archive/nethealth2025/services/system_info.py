import psutil
import platform
import subprocess
import re
import time
from datetime import timedelta
from pathlib import Path

def _read_pi_temp_vcgencmd():
    """Raspberry Pi firmware tool."""
    try:
        out = subprocess.check_output(["vcgencmd", "measure_temp"]).decode().strip()
        m = re.search(r"temp=([0-9.]+)", out)
        if m:
            c = float(m.group(1))
            f = c * 9/5 + 32
            return c, f
    except Exception:
        pass
    return None, None

def _read_linux_sysfs_temp():
    """
    Generic Linux fallback: /sys/class/thermal/thermal_zone*/temp
    Values are usually millidegrees C.
    """
    try:
        zones = sorted(Path("/sys/class/thermal").glob("thermal_zone*/temp"))
        for z in zones:
            try:
                raw = z.read_text().strip()
                if not raw:
                    continue
                val = float(raw)
                # Heuristic: if value looks like 47000 it's m°C; if 47.0 it's °C
                c = val / 1000.0 if val > 500 else val
                f = c * 9/5 + 32
                return c, f
            except Exception:
                continue
    except Exception:
        pass
    return None, None

def _read_generic_psutil_temp():
    """Works on some Linux distros / hardware; generally N/A on macOS/Windows."""
    try:
        temps = psutil.sensors_temperatures()
        if not temps:
            return None, None
        # pick the first sensor with a current value
        for entries in temps.values():
            for e in entries:
                if hasattr(e, "current") and e.current is not None:
                    c = float(e.current)
                    f = c * 9/5 + 32
                    return c, f
    except Exception:
        pass
    return None, None

def get_temperature():
    """
    Order of attempts:
    - Raspberry Pi vcgencmd
    - Linux sysfs thermal zone
    - psutil sensors
    - else N/A
    """
    c = f = None
    sys = platform.system().lower()

    # Try Pi first (works only on Pi OS)
    c, f = _read_pi_temp_vcgencmd()

    # Linux fallback (works on Pi and many Linux PCs)
    if c is None and sys == "linux":
        c, f = _read_linux_sysfs_temp()

    # Generic psutil fallback
    if c is None:
        c, f = _read_generic_psutil_temp()

    if c is None:
        return {"celsius": "N/A", "fahrenheit": "N/A",
                "status": {"color": "gray", "message": "Unknown Temperature"}}

    # Thresholds (tune as you like)
    if c < 57:
        status = {"color": "green", "message": "Good Temperature."}
    elif c <= 59:
        status = {"color": "orange", "message": "Moderate Temperature."}
    else:
        status = {"color": "red", "message": "High Temperature."}

    return {"celsius": round(c, 1), "fahrenheit": round(f, 1), "status": status}

def get_cpu_percent():
    return psutil.cpu_percent(interval=0.2)

def get_memory_usage():
    vm = psutil.virtual_memory()
    return {"used_mb": round(vm.used/1024/1024, 2),
            "total_mb": round(vm.total/1024/1024, 2),
            "percent": f"{vm.percent}%"}

def get_disk_usage():
    d = psutil.disk_usage("/")
    return {"total": f"{d.total/1024/1024/1024:.2f} GB",
            "used": f"{d.used/1024/1024/1024:.2f} GB",
            "free": f"{d.free/1024/1024/1024:.2f} GB",
            "percent": f"{d.percent}%"}

def get_uptime_str():
    try:
        uptime_seconds = time.time() - psutil.boot_time()
        return str(timedelta(seconds=int(uptime_seconds)))
    except Exception:
        return "N/A"

def get_network_counters():
    try:
        n = psutil.net_io_counters()
        return {"sent_mb": round(n.bytes_sent/1024/1024,2),
                "recv_mb": round(n.bytes_recv/1024/1024,2)}
    except Exception:
        return {"sent_mb": "N/A", "recv_mb": "N/A"}

def _arp_scan_lines():
    try:
        out = subprocess.check_output(["arp", "-a"]).decode()
        return out.splitlines()
    except Exception:
        return []

def get_network_devices_safe(mask=True):
    devices = []
    for line in _arp_scan_lines():
        m = re.search(r"\(([\d\.]+)\)\s+at\s+([\w:<>-]+)", line)
        if m:
            ip, mac = m.groups()
            mac_clean = mac.lower()
            mac_display = mac_clean[:8] + ":**:**:**" if (mask and mac_clean not in ("<incomplete>",)) else mac_clean
            devices.append({"ip": ip, "mac": mac_display, "device_type": "Unknown"})
    return devices