#!/usr/bin/env python3
import os
import sys
import json
import time
import argparse
import subprocess
import socket
import urllib.request
from urllib.error import HTTPError, URLError

# Configuration
AGENT_TOKEN = ""
BACKEND_URL = ""
METRIC_INTERVAL = 30  # seconds
POLL_INTERVAL = 10    # seconds

# Global variables keeping state
prev_cpu_times = None

def get_cpu_times():
    """Reads /proc/stat to get CPU times."""
    try:
        with open("/proc/stat", "r") as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith("cpu "):
                    parts = line.split()
                    # user, nice, system, idle, iowait, irq, softirq
                    # Indices typically: 1:user, 2:nice, 3:sys, 4:idle, 5:iowait, 6:irq, 7:softirq
                    user = float(parts[1])
                    nice = float(parts[2])
                    sys_t = float(parts[3])
                    idle = float(parts[4])
                    iowait = float(parts[5])
                    irq = float(parts[6])
                    softirq = float(parts[7])
                    return {
                        "idle": idle + iowait,
                        "non_idle": user + nice + sys_t + irq + softirq
                    }
    except Exception as e:
        print(f"[Agent] Error reading CPU times: {e}")
    return None

def get_cpu_usage_percent():
    """Calculates CPU usage percentage using deltas."""
    global prev_cpu_times
    current = get_cpu_times()
    
    if not current:
        return 0.0
        
    if not prev_cpu_times:
        prev_cpu_times = current
        return 0.0

    prev_idle = prev_cpu_times["idle"]
    prev_non_idle = prev_cpu_times["non_idle"]
    
    curr_idle = current["idle"]
    curr_non_idle = current["non_idle"]

    prev_total = prev_idle + prev_non_idle
    curr_total = curr_idle + curr_non_idle

    totald = curr_total - prev_total
    idled = curr_idle - prev_idle

    prev_cpu_times = current

    if totald == 0:
        return 0.0

    cpu_percentage = (1000 * (totald - idled) / totald + 5) / 10
    return min(100.0, max(0.0, round(cpu_percentage, 2)))

def get_ram_usage_percent():
    """Calculates RAM usage using /proc/meminfo."""
    try:
        mem_total = 0
        mem_available = 0
        with open("/proc/meminfo", "r") as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    mem_total = int(line.split()[1])
                elif line.startswith("MemAvailable:"): # Or MemFree + Buf + Cache
                    mem_available = int(line.split()[1])
                    
        if mem_total == 0:
            return 0.0
            
        usage_percent = ((mem_total - mem_available) / mem_total) * 100
        return min(100.0, max(0.0, round(usage_percent, 2)))
    except Exception as e:
        print(f"[Agent] Error reading RAM usage: {e}")
        return 0.0

def get_disk_usage_percent():
    """Calculates Disk usage using os.statvfs('/')."""
    try:
        if sys.platform == 'win32':
             return 45.0 # mock
        st = os.statvfs('/')
        total = st.f_blocks * st.f_frsize
        free = st.f_bavail * st.f_frsize
        if total == 0:
            return 0.0
        usage_percent = ((total - free) / total) * 100
        return min(100.0, max(0.0, round(usage_percent, 2)))
    except Exception as e:
        print(f"[Agent] Error reading Disk usage: {e}")
        return 0.0

def get_network_bytes():
    """Reads network usage from /proc/net/dev."""
    try:
        if sys.platform == 'win32':
            return {"networkIn": 0, "networkOut": 0}
            
        network_in = 0
        network_out = 0
        with open("/proc/net/dev", "r") as f:
            lines = f.readlines()
            for line in lines[2:]: # Skip headers
                parts = line.split(':')
                if len(parts) == 2:
                    iface_name = parts[0].strip()
                    if iface_name == 'lo':
                        continue
                        
                    stats = parts[1].split()
                    if len(stats) >= 9:
                        network_in += int(stats[0]) # Receive bytes
                        network_out += int(stats[8]) # Transmit bytes
                        
        return {"networkIn": network_in, "networkOut": network_out}
    except Exception as e:
        print(f"[Agent] Error reading Network usage: {e}")
        return {"networkIn": 0, "networkOut": 0}

def get_local_ip():
    """Gets the primary local IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 8.8.8.8 is a dummy address, no packet is sent
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None

# ==================== HTTP Helper ====================

def make_request(method, endpoint, payload=None):
    """Makes an HTTP request using urllib."""
    url = f"{BACKEND_URL}{endpoint}"
    headers = {
        "x-agent-token": AGENT_TOKEN,
        "User-Agent": "ServerMonitorAgent/1.0"
    }
    
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            return {"status": response.status, "body": res_body}
    except HTTPError as e:
        res_body = e.read().decode('utf-8') if e.fp else str(e)
        return {"status": e.code, "body": res_body}
    except URLError as e:
        raise Exception(f"Network error: {e.reason}")
    except Exception as e:
        raise Exception(f"Request error: {str(e)}")

# ==================== Core Logic ====================

def push_metrics():
    """Collects and pushes metrics to the backend."""
    net_st = get_network_bytes()
    payload = {
        "cpuUsage": get_cpu_usage_percent(),
        "ramUsage": get_ram_usage_percent(),
        "diskUsage": get_disk_usage_percent(),
        "networkIn": net_st["networkIn"],
        "networkOut": net_st["networkOut"],
        "ipAddress": get_local_ip()
    }
    
    try:
        res = make_request("POST", "/api/metrics/push", payload)
        if res["status"] == 201:
            print(f"[Agent] Metrics pushed | CPU: {payload['cpuUsage']}% | RAM: {payload['ramUsage']}% | Disk: {payload['diskUsage']}%")
        else:
            print(f"[Agent] Failed to push metrics: {res['status']} | {res['body']}")
    except Exception as e:
        print(f"[Agent] Error pushing metrics: {e}")

def poll_commands():
    """Polls for pending commands from backend."""
    try:
        res = make_request("GET", "/api/commands/agent/poll")
        if res["status"] == 200 and res["body"] and res["body"].strip() != "null":
            try:
                command_res = json.loads(res["body"])
                command = command_res.get("data")
                if command and command.get("id"):
                    execute_command(command)
            except json.JSONDecodeError:
                 print(f"[Agent] Invalid JSON received from poll: {res['body']}")
    except Exception as e:
        pass # Suppress polling errors to avoid log spam, mostly likely timeout/unreachable

def execute_command(command):
    """Executes a bash command and returns result."""
    cmd_id = command.get("id")
    cmd_payload = command.get("payload")
    cmd_type = command.get("commandType")
    
    print(f"[Agent] Executing command [{cmd_id}]: {cmd_type} - {cmd_payload}")
    
    result_log = ""
    status = "SUCCESS"
    
    try:
        # Run command tightly capturing stdout and stderr
        process = subprocess.run(
            cmd_payload, 
            shell=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT, 
            timeout=30,
            text=True
        )
        result_log = process.stdout
        if process.returncode != 0:
            status = "FAILED"
    except subprocess.TimeoutExpired as e:
        result_log = f"Command timed out after 30 seconds."
        status = "FAILED"
    except Exception as e:
        result_log = str(e)
        status = "FAILED"

    # Submit result
    payload = {"status": status, "resultLog": result_log}
    try:
        res = make_request("PUT", f"/api/commands/agent/{cmd_id}/result", payload)
        print(f"[Agent] Command [{cmd_id}] result submitted: {status}")
    except Exception as e:
        print(f"[Agent] Failed to submit command result: {e}")

# ==================== Main Loop ====================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Server Monitor Agent")
    parser.add_argument("-t", "--token", required=True, help="Agent Token")
    parser.add_argument("-u", "--url", required=True, help="Backend URL (e.g. http://ubuntu-server-management.duckdns.org)")
    args = parser.parse_args()

    AGENT_TOKEN = args.token
    BACKEND_URL = args.url

    print(f"[Agent] Started -> Python Agent | Token: {AGENT_TOKEN} | Backend: {BACKEND_URL}")

    # Warm-up CPU timing
    get_cpu_usage_percent()
    time.sleep(2)

    last_metric_time = 0
    last_poll_time = 0

    while True:
        current_time = time.time()
        
        # Poll Commands (Every 10s)
        if current_time - last_poll_time >= POLL_INTERVAL:
            poll_commands()
            last_poll_time = current_time
            
        # Push Metrics (Every 30s)
        if current_time - last_metric_time >= METRIC_INTERVAL:
            push_metrics()
            last_metric_time = current_time
            
        time.sleep(1)
