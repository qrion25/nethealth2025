import types
from services.system_info import get_system_info

def test_get_system_info_shape():
    info = get_system_info()
    assert isinstance(info, dict)

    # Required keys exist
    for key in ("battery", "memory", "storage", "network"):
        assert key in info

    # Battery shape
    bat = info["battery"]
    assert isinstance(bat, dict)
    assert "level" in bat and "charging" in bat
    assert bat["level"] is None or (0.0 <= bat["level"] <= 1.0)

    # Memory shape
    mem = info["memory"]
    assert isinstance(mem, dict)
    for k in ("used_mb", "total_mb", "percent"):
        assert k in mem
    assert mem["percent"] is None or (0.0 <= mem["percent"] <= 100.0)

    # Storage shape
    sto = info["storage"]
    assert isinstance(sto, dict)
    for k in ("used_gb", "quota_gb", "percent"):
        assert k in sto
    assert sto["percent"] is None or (0.0 <= sto["percent"] <= 100.0)

    # Network shape
    net = info["network"]
    assert isinstance(net, dict)
    for k in ("online", "effective_type", "downlink_mbps", "rtt_ms"):
        assert k in net