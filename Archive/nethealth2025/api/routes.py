from flask import Blueprint, jsonify
from services.system_info import (
    get_temperature, get_cpu_percent, get_memory_usage,
    get_disk_usage, get_uptime_str, get_network_counters,
    get_network_devices_safe
)

api_bp = Blueprint("api", __name__)

@api_bp.route("/status", methods=["GET"])
def status():
    return jsonify({
        "temperature": get_temperature(),
        "cpu_usage": f"{get_cpu_percent()}%",
        "memory_usage": get_memory_usage(),
        "disk_usage": get_disk_usage(),
        "uptime": get_uptime_str(),
        "network_usage": get_network_counters()
    })

@api_bp.route("/devices", methods=["GET"])
def devices():
    return jsonify({"devices": get_network_devices_safe(mask=True)})
