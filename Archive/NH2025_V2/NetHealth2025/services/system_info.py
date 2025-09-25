# services/system_info.py
from __future__ import annotations

import os
import platform
import shutil
import socket
import time
from typing import Any, Dict, Optional

try:
    import psutil  # type: ignore
except Exception:  # pragma: no cover
    psutil = None

# ---------- Helpers (updated) ----------

from typing import Optional, Any, Dict
import socket
import shutil
import time
import platform

def _detect_online(timeout: float = 0.5) -> bool:
    """Quick online check by opening a TCP socket to a well-known host."""
    try:
        sock = socket.create_connection(("1.1.1.1", 53), timeout=timeout)
        sock.close()
        return True
    except OSError:
        return False


def _measure_rtt(host: str = "1.1.1.1", port: int = 443, tries: int = 2, timeout: float = 0.6) -> Optional[float]:
    """Best-effort TCP connect RTT in milliseconds (avg of 'tries')."""
    samples = []
    for _ in range(max(1, tries)):
        try:
            start = time.perf_counter()
            sock = socket.create_connection((host, port), timeout=timeout)
            sock.close()
            end = time.perf_counter()
            samples.append((end - start) * 1000.0)
        except OSError:
            pass
    if not samples:
        return None
    return sum(samples) / len(samples)


def _boot_time_epoch() -> Optional[int]:
    try:
        if psutil and hasattr(psutil, "boot_time"):
            return int(psutil.boot_time())
    except Exception:
        pass
    return None


def _uptime_seconds() -> Optional[int]:
    bt = _boot_time_epoch()
    if bt is None:
        return None
    return int(time.time() - bt)


def _memory_info() -> Dict[str, Optional[float]]:
    """Returns used/total/percent in MB and % (psutil if available)."""
    if psutil:
        try:
            vm = psutil.virtual_memory()
            total_mb = vm.total / (1024 * 1024)
            # “used” ~ total - available feels closer to user-visible memory pressure
            used_mb = (vm.total - vm.available) / (1024 * 1024)
            percent = float(vm.percent)
            return {
                "used_mb": round(used_mb, 2),
                "total_mb": round(total_mb, 2),
                "percent": round(percent, 1),
            }
        except Exception:
            pass
    return {"used_mb": None, "total_mb": None, "percent": None}


def _storage_info() -> Dict[str, Optional[float]]:
    """Disk usage for root filesystem. Keeps your original keys."""
    try:
        total, used, free = shutil.disk_usage("/")
        total_gb = total / (1024 ** 3)
        used_gb = used / (1024 ** 3)
        free_gb = free / (1024 ** 3)
        percent = (used / total) * 100 if total > 0 else None
        return {
            "total_gb": round(total_gb, 2),
            "quota_gb": round(total_gb, 2),  # alias to satisfy existing shape
            "used_gb": round(used_gb, 2),
            "free_gb": round(free_gb, 2),
            "percent": round(percent, 1) if percent is not None else None,
        }
    except Exception:
        return {"total_gb": None, "quota_gb": None, "used_gb": None, "free_gb": None, "percent": None}


def _list_up_non_loopback_ifaces() -> list[str]:
    """
    Return interface names that are up and not loopback, preferring those
    that have at least one IPv4 address (real connectivity signal).
    """
    names: list[str] = []
    if not psutil:
        return names
    try:
        stats = psutil.net_if_stats() or {}
        addrs = psutil.net_if_addrs() or {}

        # up & not loopback
        candidates = [n for n, st in stats.items() if getattr(st, "isup", False) and not n.lower().startswith(("lo", "loopback"))]

        # prefer those with IPv4
        ipv4_first, ipv4_later = [], []
        for n in candidates:
            has_ipv4 = any(getattr(a, "family", None) == socket.AF_INET for a in addrs.get(n, []))
            (ipv4_first if has_ipv4 else ipv4_later).append(n)

        names = ipv4_first + ipv4_later
    except Exception:
        pass
    return names


def _active_interface_name() -> Optional[str]:
    """Best-effort guess of an active interface name (cross-platform)."""
    # 1) Prefer up, non-loopback, with IPv4
    candidates = _list_up_non_loopback_ifaces()
    if candidates:
        return candidates[0]

    # 2) Fallback: anything up (even if no IPv4)
    if psutil:
        try:
            for n, st in (psutil.net_if_stats() or {}).items():
                if getattr(st, "isup", False):
                    return n
        except Exception:
            pass

    # 3) Nothing found
    return None


def _friendly_interface_label(name: Optional[str]) -> Optional[str]:
    """Map raw interface names to friendly labels (macOS/Windows/Linux best-effort)."""
    if not name:
        return None
    n = name.lower()

    # Loopback / virtual
    if n.startswith(("lo", "loopback")):
        return "Loopback"
    if n.startswith(("utun", "tap", "tun", "vmnet", "br", "vbox", "docker", "podman", "wg")) or "bridge" in n:
        return "Virtual/Bridge"

    # Windows common strings
    if "wi-fi" in n or "wifi" in n or "wlan" in n:
        return "Wi-Fi"
    if "ethernet" in n or "lan" in n:
        return "Ethernet"
    if "bluetooth" in n:
        return "Bluetooth PAN"

    # macOS common names
    if n.startswith("en"):
        # en0 often Wi-Fi on laptops; other en* can be Ethernet/Thunderbolt
        return "Wi-Fi" if n == "en0" else "Ethernet"
    if n.startswith("anpi"):  # Apple Network Private Interface family
        return "Wi-Fi"
    if n.startswith("awdl"):  # Apple Wireless Direct Link
        return "Wi-Fi (AWDL)"

    # Linux predictable names
    if n.startswith(("wlan", "wlp", "wlx")):
        return "Wi-Fi"
    if n.startswith(("eth", "enp", "ens", "eno")):
        return "Ethernet"

    # Fallback to raw name
    return name


def _network_info() -> Dict[str, Optional[Any]]:
    """Shape compatible with your frontend."""
    iface_raw = _active_interface_name()
    return {
        "online": _detect_online(),
        "effective_type": None,     # browser concept; kept for consistency
        "downlink_mbps": None,      # populate later if you add a throughput test
        "rtt_ms": _measure_rtt(),   # quick TCP RTT estimate
        "interface": iface_raw,
        "interface_friendly": _friendly_interface_label(iface_raw),
    }


# ---------- Public ----------

def get_system_info() -> Dict[str, Any]:
    uname = platform.uname()
    cpu_name = uname.processor or platform.machine() or ""
    try:
        cores_physical = psutil.cpu_count(logical=False) if psutil else None
    except Exception:
        cores_physical = None

    return {
        # meta
        "timestamp": int(time.time()),
        "platform": uname.system,
        "platform_release": uname.release,
        "machine": uname.machine,
        "architecture": (platform.architecture()[0] or "").strip(),
        "cpu": cpu_name.lower(),
        "cpu_cores": int(cores_physical) if cores_physical is not None else int(os.cpu_count() or 1),

        # legacy field kept (you also have uptime_seconds below)
        "boot_time": _boot_time_epoch(),

        # primary sections used by UI/tests
        "battery": {"level": None, "charging": None},  # unknown server-side
        "memory": _memory_info(),
        "storage": _storage_info(),
        "network": _network_info(),

        # convenient extra
        "uptime_seconds": _uptime_seconds(),
    }