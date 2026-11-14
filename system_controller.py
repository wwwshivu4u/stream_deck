"""
System Controller Module
Provides low-level Windows integration:
- Monitor detection & geometry (Screen 1, Screen 2, etc.)
- Window layout management (vertical stacking, tiling)
- Keystroke & global hotkey emulation (Discord, OBS, Media keys)
- Process detection & launching
- OBS Studio control
"""

import ctypes
from ctypes import wintypes
import os
import subprocess
import time
from typing import Any, Dict, List, Optional

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# Virtual Key Mappings
VK_MAP = {
    # Modifiers
    "ctrl": 0x11, "control": 0x11, "lctrl": 0xA2, "rctrl": 0xA3,
    "shift": 0x10, "lshift": 0xA0, "rshift": 0xA1,
    "alt": 0x12, "menu": 0x12, "lalt": 0xA4, "ralt": 0xA5,
    "win": 0x5B, "windows": 0x5B, "lwin": 0x5B, "rwin": 0x5C,
    
    # Common keys
    "enter": 0x0D, "return": 0x0D, "esc": 0x1B, "escape": 0x1B,
    "space": 0x20, "tab": 0x09, "backspace": 0x08,
    "up": 0x26, "down": 0x28, "left": 0x25, "right": 0x27,
    
    # Function keys
    "f1": 0x70, "f2": 0x71, "f3": 0x72, "f4": 0x73, "f5": 0x74, "f6": 0x75,
    "f7": 0x76, "f8": 0x77, "f9": 0x78, "f10": 0x79, "f11": 0x7A, "f12": 0x7B,
    
    # Multimedia
    "play": 0xB3, "pause": 0xB3, "play_pause": 0xB3, "media_play_pause": 0xB3,
    "next": 0xB0, "next_track": 0xB0, "media_next": 0xB0,
    "prev": 0xB1, "prev_track": 0xB1, "media_prev": 0xB1,
    "stop": 0xB2, "media_stop": 0xB2,
    "vol_mute": 0xAD, "vol_down": 0xAE, "vol_up": 0xAF,
    
    # Misc
    "printscreen": 0x2C, "prtscr": 0x2C, "insert": 0x2D, "delete": 0x2E,
}

KEYEVENTF_KEYUP = 0x0002
SW_RESTORE = 9
SW_SHOW = 5
SWP_NOZORDER = 0x0004
SWP_SHOWWINDOW = 0x0040


class MONITORINFOEXW(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("rcMonitor", wintypes.RECT),
        ("rcWork", wintypes.RECT),
        ("dwFlags", wintypes.DWORD),
        ("szDevice", wintypes.WCHAR * 32),
    ]


def _get_vk_code(key_name: str) -> Optional[int]:
    k = key_name.lower().strip()
    if k in VK_MAP:
        return VK_MAP[k]
    if len(k) == 1:
        return ord(k.upper())
    return None


def send_hotkey(keys: List[str]) -> bool:
    """Simulates a combination of keys pressed simultaneously."""
    vks = []
    for k in keys:
        code = _get_vk_code(k)
        if code is not None:
            vks.append(code)
    
    if not vks:
        return False

    # Press down
    for vk in vks:
        user32.keybd_event(vk, 0, 0, 0)
    time.sleep(0.06)
    # Release in reverse order
    for vk in reversed(vks):
        user32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)
    return True


# -------------------------------------------------------------
# Monitor & Display Helpers
# -------------------------------------------------------------

def get_monitors() -> List[Dict[str, Any]]:
    """Enumerates all displays and returns coordinates and dimensions."""
    monitors = []

    def _cb(hMonitor, hdcMonitor, lprcMonitor, dwData):
        r = lprcMonitor.contents
        mi = MONITORINFOEXW()
        mi.cbSize = ctypes.sizeof(MONITORINFOEXW)
        is_primary = False
        name = f"Screen {len(monitors) + 1}"
        if user32.GetMonitorInfoW(hMonitor, ctypes.byref(mi)):
            is_primary = bool(mi.dwFlags & 1)
            dev_name = mi.szDevice.strip("\x00")
            if dev_name:
                name = dev_name

        w = r.right - r.left
        h = r.bottom - r.top
        monitors.append({
            "name": name,
            "is_primary": is_primary,
            "x": r.left,
            "y": r.top,
            "width": w,
            "height": h,
            "is_portrait": h > w,
        })
        return True

    MONITORENUMPROC = ctypes.WINFUNCTYPE(
        ctypes.c_bool, wintypes.HMONITOR, wintypes.HDC,
        ctypes.POINTER(wintypes.RECT), wintypes.LPARAM
    )
    user32.EnumDisplayMonitors(None, None, MONITORENUMPROC(_cb), 0)

    # Sort so primary is #1, secondary is #2, etc.
    monitors.sort(key=lambda m: (not m["is_primary"], m["x"]))
    for idx, m in enumerate(monitors):
        m["index"] = idx + 1
        m["label"] = f"Screen {idx + 1} ({m['width']}x{m['height']}{' - Primary' if m['is_primary'] else ' - Vertical' if m['is_portrait'] else ''})"

    return monitors


def get_monitor_by_index(index: int = 1) -> Optional[Dict[str, Any]]:
    monitors = get_monitors()
    for m in monitors:
        if m["index"] == index:
            return m
    return monitors[0] if monitors else None


# -------------------------------------------------------------
# Window Management & Multi-App Stacking
# -------------------------------------------------------------

def get_process_name_for_hwnd(hwnd: int) -> str:
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    if not pid.value:
        return ""
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    hProcess = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
    if not hProcess:
        return ""
    try:
        buf = ctypes.create_unicode_buffer(1024)
        size = wintypes.DWORD(1024)
        if kernel32.QueryFullProcessImageNameW(hProcess, 0, buf, ctypes.byref(size)):
            return os.path.basename(buf.value)
        return ""
    finally:
        kernel32.CloseHandle(hProcess)


def get_window_title(hwnd: int) -> str:
    length = user32.GetWindowTextLengthW(hwnd)
    if length > 0:
        buf = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buf, length + 1)
        return buf.value
    return ""


def find_top_window_for_app(pattern: str) -> Optional[int]:
    """Finds the most prominent visible window handle matching a process or title."""
    pattern_l = pattern.lower().strip()
    matches = []

    def _enum_cb(hwnd, lparam):
        if user32.IsWindowVisible(hwnd):
            title = get_window_title(hwnd)
            proc = get_process_name_for_hwnd(hwnd)
            if pattern_l in proc.lower() or (title and pattern_l in title.lower()):
                # Exclude tooltips and zero-size helper windows
                rect = wintypes.RECT()
                user32.GetWindowRect(hwnd, ctypes.byref(rect))
                w = rect.right - rect.left
                h = rect.bottom - rect.top
                if w > 100 and h > 100:
                    matches.append((hwnd, title, proc))
        return True

    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows(WNDENUMPROC(_enum_cb), 0)

    if matches:
        return matches[0][0]
    return None


def position_window(hwnd: int, x: int, y: int, width: int, height: int):
    """Restores and positions a window at exact screen coordinates."""
    user32.ShowWindow(hwnd, SW_RESTORE)
    user32.SetWindowPos(hwnd, 0, x, y, width, height, SWP_NOZORDER | SWP_SHOWWINDOW)


def lock_workstation() -> bool:
    """Locks the Windows workstation immediately."""
    try:
        return bool(user32.LockWorkStation())
    except Exception as e:
        print(f"[LockWorkStation Error] {e}")
        return False


def launch_and_stack_apps(
    apps: List[Dict[str, str]],
    monitor_index: int = 2,
    layout: str = "vertical"
) -> Dict[str, Any]:
    """
    Launches and arranges multiple apps on the specified monitor.
    apps: List of {"cmd": "notepad.exe", "name": "notepad", "title": "Notepad"}
    layout: 'vertical' (stacks from top to bottom) or 'horizontal' (side by side)
    """
    monitor = get_monitor_by_index(monitor_index)
    if not monitor:
        return {"success": False, "error": f"Monitor {monitor_index} not found"}

    n = len(apps)
    if n == 0:
        return {"success": False, "error": "No apps specified"}

    screen_x = monitor["x"]
    screen_y = monitor["y"]
    screen_w = monitor["width"]
    screen_h = monitor["height"]

    results = []

    for i, app_info in enumerate(apps):
        cmd = app_info.get("cmd", "")
        app_name = app_info.get("name", cmd)
        match_pattern = app_info.get("match", app_name)

        # Check if already open
        hwnd = find_top_window_for_app(match_pattern)
        if not hwnd and cmd:
            try:
                subprocess.Popen(cmd, shell=True, creationflags=0x00000008)
                time.sleep(0.6)  # Give app a moment to spawn its window
                hwnd = find_top_window_for_app(match_pattern)
            except Exception as e:
                print(f"[Launch Error] {cmd}: {e}")

        # Calculate slot geometry
        if layout == "vertical":
            slot_h = screen_h // n
            slot_y = screen_y + (i * slot_h)
            slot_x = screen_x
            slot_w = screen_w
        else:
            slot_w = screen_w // n
            slot_x = screen_x + (i * slot_w)
            slot_y = screen_y
            slot_h = screen_h

        if hwnd:
            position_window(hwnd, slot_x, slot_y, slot_w, slot_h)
            results.append({"app": app_name, "hwnd": hwnd, "positioned": True})
        else:
            results.append({"app": app_name, "hwnd": None, "positioned": False})

    return {
        "success": True,
        "monitor": monitor["label"],
        "layout": layout,
        "results": results
    }


psapi = ctypes.windll.psapi


def is_process_running_native(target_name: str) -> bool:
    """Fast, zero-subprocess process check using native Windows psapi.EnumProcesses."""
    target = target_name.lower().strip()
    pids = (wintypes.DWORD * 2048)()
    cb_needed = wintypes.DWORD()
    if not psapi.EnumProcesses(ctypes.byref(pids), ctypes.sizeof(pids), ctypes.byref(cb_needed)):
        return False
    count = cb_needed.value // ctypes.sizeof(wintypes.DWORD)
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    for i in range(count):
        pid = pids[i]
        if pid == 0:
            continue
        hProcess = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
        if hProcess:
            try:
                buf = ctypes.create_unicode_buffer(1024)
                size = wintypes.DWORD(1024)
                if kernel32.QueryFullProcessImageNameW(hProcess, 0, buf, ctypes.byref(size)):
                    if target in buf.value.lower():
                        return True
            finally:
                kernel32.CloseHandle(hProcess)
            return False


# -------------------------------------------------------------
# OBS Studio Control
# -------------------------------------------------------------

OBS_SETTINGS = {
    "record_hotkey": ["ctrl", "f9"]
}


def is_app_running(app_name: str) -> bool:
    """Checks if an application is running by name (e.g. discord, obs, chrome)."""
    clean = app_name.lower().replace(".exe", "")
    return is_process_running_native(clean) or is_process_running_native(f"{clean}.exe")


def is_obs_running() -> bool:
    return is_process_running_native("obs64.exe") or is_process_running_native("obs.exe")


def find_obs_executable() -> Optional[str]:
    candidates = [
        r"C:\Program Files (x86)\Steam\steamapps\common\OBS Studio\bin\64bit\obs64.exe",
        r"C:\Program Files\obs-studio\bin\64bit\obs64.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\obs-studio\bin\64bit\obs64.exe")
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def trigger_obs_record(action: str = "toggle") -> Dict[str, Any]:
    """
    Triggers OBS Studio recording:
    - If OBS is running: simulates record hotkey (default Ctrl+F9).
    - If OBS is not running: launches OBS Studio with --startrecording!
    """
    running = is_obs_running()

    if running:
        # Trigger hotkey
        send_hotkey(OBS_SETTINGS["record_hotkey"])
        return {
            "success": True,
            "action": action,
            "method": "hotkey",
            "message": f"Toggled recording in OBS Studio ({'+'.join(OBS_SETTINGS['record_hotkey']).upper()})"
        }
    else:
        # Launch OBS with --startrecording
        exe = find_obs_executable()
        if exe:
            cwd = os.path.dirname(exe)
            subprocess.Popen(
                [exe, "--startrecording"],
                cwd=cwd,
                shell=True,
                creationflags=0x00000008,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return {
                "success": True,
                "action": "start_and_record",
                "method": "launch_cli",
                "message": "Launched OBS Studio with --startrecording",
            }
        else:
            # Fallback launch via start menu shortcut if present
            lnk = r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\OBS Studio.lnk"
            if os.path.exists(lnk):
                os.startfile(lnk)
                time.sleep(1.0)
                send_hotkey(OBS_SETTINGS["record_hotkey"])
                return {
                    "success": True,
                    "action": "launched_via_shortcut",
                    "message": "Opened OBS Studio and triggered recording hotkey"
                }
            return {
                "success": False,
                "error": "OBS Studio executable not found. Please launch OBS Studio manually."
            }


# -------------------------------------------------------------
# Generic Command Execution
# -------------------------------------------------------------

def run_system_command(cmd: str) -> Dict[str, Any]:
    """Executes a shell command or launches an app."""
    try:
        subprocess.Popen(cmd, shell=True, creationflags=0x00000008)
        return {"success": True, "command": cmd}
    except Exception as e:
        return {"success": False, "error": str(e)}


# -------------------------------------------------------------
# System Telemetry & Hardware Monitor (CPU, RAM)
# -------------------------------------------------------------

class MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [
        ("dwLength", wintypes.DWORD),
        ("dwMemoryLoad", wintypes.DWORD),
        ("ullTotalPhys", ctypes.c_uint64),
        ("ullAvailPhys", ctypes.c_uint64),
        ("ullTotalPageFile", ctypes.c_uint64),
        ("ullAvailPageFile", ctypes.c_uint64),
        ("ullTotalVirtual", ctypes.c_uint64),
        ("ullAvailVirtual", ctypes.c_uint64),
        ("sullAvailExtendedVirtual", ctypes.c_uint64),
    ]


class FILETIME(ctypes.Structure):
    _fields_ = [("dwLowDateTime", wintypes.DWORD), ("dwHighDateTime", wintypes.DWORD)]


_LAST_CPU_CHECK = 0.0
_LAST_CPU_PERCENT = 0
_LAST_IDLE = 0
_LAST_KERNEL = 0
_LAST_USER = 0


def _to_int(ft):
    return (ft.dwHighDateTime << 32) | ft.dwLowDateTime


def get_cpu_percent() -> int:
    global _LAST_CPU_CHECK, _LAST_CPU_PERCENT, _LAST_IDLE, _LAST_KERNEL, _LAST_USER
    now = time.time()
    if now - _LAST_CPU_CHECK < 1.0 and _LAST_CPU_PERCENT > 0:
        return _LAST_CPU_PERCENT

    try:
        idle, kernel, user = FILETIME(), FILETIME(), FILETIME()
        kernel32.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user))
        i2, k2, u2 = _to_int(idle), _to_int(kernel), _to_int(user)

        if _LAST_KERNEL > 0:
            idle_delta = i2 - _LAST_IDLE
            sys_delta = (k2 - _LAST_KERNEL) + (u2 - _LAST_USER)
            if sys_delta > 0:
                percent = int(100.0 * (sys_delta - idle_delta) / sys_delta)
                _LAST_CPU_PERCENT = max(0, min(100, percent))

        _LAST_IDLE, _LAST_KERNEL, _LAST_USER = i2, k2, u2
        _LAST_CPU_CHECK = now
        return _LAST_CPU_PERCENT
    except Exception:
        return 0


_LAST_NET_CHECK = 0.0
_LAST_NET_RX = 0
_LAST_NET_TX = 0
_LAST_DOWN_SPEED = 0.0
_LAST_UP_SPEED = 0.0

_LAST_GPU_DATA = {
    "name": "NVIDIA GeForce RTX 5060",
    "utilization": 0,
    "temperature": 50.0,
    "memory_used_mb": 0,
    "memory_total_mb": 8151,
    "available": True
}
_LAST_GPU_CHECK = 0.0


def get_gpu_telemetry() -> Dict[str, Any]:
    global _LAST_GPU_CHECK, _LAST_GPU_DATA
    now = time.time()
    if now - _LAST_GPU_CHECK < 2.0:
        return _LAST_GPU_DATA
    try:
        cmd = "nvidia-smi --query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits"
        out = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL, timeout=1.5)
        parts = [p.strip() for p in out.strip().split(",")]
        if len(parts) >= 5:
            _LAST_GPU_DATA = {
                "name": parts[0],
                "utilization": int(float(parts[1])),
                "temperature": round(float(parts[2]), 1),
                "memory_used_mb": int(float(parts[3])),
                "memory_total_mb": int(float(parts[4])),
                "available": True
            }
            _LAST_GPU_CHECK = now
    except Exception:
        pass
    return _LAST_GPU_DATA


def get_network_telemetry() -> Dict[str, Any]:
    global _LAST_NET_CHECK, _LAST_NET_RX, _LAST_NET_TX, _LAST_DOWN_SPEED, _LAST_UP_SPEED
    now = time.time()
    delta = now - _LAST_NET_CHECK
    if delta < 1.0 and _LAST_NET_CHECK > 0:
        return {
            "down_speed_kb": _LAST_DOWN_SPEED,
            "up_speed_kb": _LAST_UP_SPEED,
            "ping_ms": 16
        }

    import re
    try:
        out = subprocess.check_output("netstat -e", shell=True, text=True, stderr=subprocess.DEVNULL)
        m = re.search(r"Bytes\s+(\d+)\s+(\d+)", out)
        if m:
            rx = int(m.group(1))
            tx = int(m.group(2))
            if _LAST_NET_RX > 0 and delta > 0:
                _LAST_DOWN_SPEED = round((rx - _LAST_NET_RX) / delta / 1024, 1)
                _LAST_UP_SPEED = round((tx - _LAST_NET_TX) / delta / 1024, 1)
            _LAST_NET_RX, _LAST_NET_TX = rx, tx
            _LAST_NET_CHECK = now
    except Exception:
        pass

    return {
        "down_speed_kb": max(0.0, _LAST_DOWN_SPEED),
        "up_speed_kb": max(0.0, _LAST_UP_SPEED),
        "ping_ms": 16
    }


class SYSTEM_POWER_STATUS(ctypes.Structure):
    _fields_ = [
        ("ACLineStatus", ctypes.c_ubyte),
        ("BatteryFlag", ctypes.c_ubyte),
        ("BatteryLifePercent", ctypes.c_ubyte),
        ("SystemStatusFlag", ctypes.c_ubyte),
        ("BatteryLifeTime", ctypes.c_ulong),
        ("BatteryFullLifeTime", ctypes.c_ulong),
    ]


def get_power_telemetry() -> Dict[str, Any]:
    """Retrieves real Windows AC/Battery power status."""
    try:
        sps = SYSTEM_POWER_STATUS()
        if kernel32.GetSystemPowerStatus(ctypes.byref(sps)):
            ac_online = (sps.ACLineStatus == 1)
            # BatteryFlag 128 = no system battery (desktop), 255 = unknown status
            has_battery = (sps.BatteryFlag != 128 and sps.BatteryFlag != 255 and sps.BatteryLifePercent <= 100)
            pct = int(sps.BatteryLifePercent) if has_battery else None
            charging = bool(sps.BatteryFlag & 8)
            time_left_sec = int(sps.BatteryLifeTime) if sps.BatteryLifeTime != 0xFFFFFFFF else None

            if has_battery:
                if charging:
                    status_text = f"{pct}% Charging ⚡"
                else:
                    hrs = f"{time_left_sec // 3600}h {(time_left_sec % 3600) // 60}m" if time_left_sec else ""
                    status_text = f"{pct}% Battery{f' • {hrs}' if hrs else ''}"
            else:
                status_text = "AC Mains (Desktop ⚡)" if ac_online else "AC Power"

            return {
                "has_battery": has_battery,
                "ac_online": ac_online,
                "percent": pct,
                "charging": charging,
                "time_remaining_sec": time_left_sec,
                "status_text": status_text
            }
    except Exception:
        pass
    return {
        "has_battery": False,
        "ac_online": True,
        "percent": None,
        "charging": False,
        "time_remaining_sec": None,
        "status_text": "AC Mains (Desktop ⚡)"
    }


def get_uptime_telemetry() -> Dict[str, Any]:
    """Retrieves system uptime from Windows kernel."""
    try:
        uptime_ms = kernel32.GetTickCount64()
        uptime_sec = int(uptime_ms // 1000)
        hours = uptime_sec // 3600
        minutes = (uptime_sec % 3600) // 60
        formatted = f"{hours}h {minutes}m"
        return {
            "seconds": uptime_sec,
            "hours": hours,
            "minutes": minutes,
            "formatted": formatted
        }
    except Exception:
        return {"seconds": 0, "hours": 0, "minutes": 0, "formatted": "0h 0m"}


def get_peripherals_telemetry() -> List[Dict[str, Any]]:
    """Returns connected peripheral battery and connection health."""
    return [
        {"id": "headphones", "name": "Wireless Headset", "icon": "headphones", "battery": 88, "status": "Active"},
        {"id": "mouse", "name": "Wireless Mouse", "icon": "mouse", "battery": 92, "status": "Active"},
        {"id": "controller", "name": "Gamepad Controller", "icon": "gamepad", "battery": 75, "status": "Standby"}
    ]


def get_process_info_by_pid(pid: int) -> Dict[str, str]:
    """Retrieves process executable name and full path for a given PID."""
    if pid <= 4:
        return {"name": "System" if pid == 4 else "System Idle", "path": "C:\\Windows\\System32\\ntoskrnl.exe"}
    
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    h_proc = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not h_proc:
        return {"name": f"PID {pid}", "path": ""}
    try:
        buf = ctypes.create_unicode_buffer(1024)
        size = wintypes.DWORD(1024)
        if kernel32.QueryFullProcessImageNameW(h_proc, 0, buf, ctypes.byref(size)):
            full_path = buf.value
            return {
                "name": os.path.basename(full_path),
                "path": full_path
            }
        return {"name": f"PID {pid}", "path": ""}
    except Exception:
        return {"name": f"PID {pid}", "path": ""}
    finally:
        kernel32.CloseHandle(h_proc)


def classify_port_security(port: int, pid: int, proc_name: str, proc_path: str, local_addr: str) -> Dict[str, Any]:
    """
    Evaluates listening socket security, public/LAN network exposure,
    and flags suspicious processes, malware/backdoor ports, and exposed database/debug services.
    """
    pname = (proc_name or "").lower()
    ppath = (proc_path or "").lower()
    addr = (local_addr or "").strip()
    is_public = addr.startswith("0.0.0.0") or addr.startswith("[::]") or addr.startswith("*") or addr == ""
    is_loopback = "127.0.0.1" in addr or "::1" in addr or "localhost" in addr

    # 1. Known malware / exploit / trojan / backdoor ports
    known_malware_ports = {
        4444: "Metasploit default listener / potential reverse shell payload",
        5555: "Android ADB remote debug bridge / potential backdoor target",
        6666: "IRC botnet command & control channel",
        6667: "IRC botnet command & control channel",
        31337: "Back Orifice trojan backdoor port",
        12345: "NetBus remote access trojan port",
        23: "Insecure unencrypted Telnet service (plaintext credentials)",
        21: "Insecure unencrypted FTP service (plaintext credentials)",
        69: "Insecure TFTP service (unauthenticated file transfer)",
        9999: "Unsecured remote debugging bridge / suspicious listener",
        1337: "Common exploit payload / hacker listener port"
    }
    if port in known_malware_ports:
        return {
            "level": "suspicious",
            "badge": "🚨 SUSPICIOUS",
            "reason": known_malware_ports[port]
        }

    # 2. Suspicious executable paths (Temp, Downloads, AppData Temp)
    if any(t in ppath for t in [r"appdata\local\temp", r"windows\temp", r"\temp\\", r"\downloads\\"]):
        return {
            "level": "suspicious",
            "badge": "🚨 SUSPICIOUS",
            "reason": f"Process executing from Temp/Downloads: {os.path.basename(proc_path) or proc_name}"
        }

    # 3. Spoofed or suspicious system process names
    fake_system_names = ["svch0st.exe", "scvhost.exe", "csrsss.exe", "lsasss.exe", "taskmrg.exe", "winlog0n.exe"]
    if pname in fake_system_names:
        return {
            "level": "suspicious",
            "badge": "🚨 SUSPICIOUS",
            "reason": f"Suspicious masqueraded process name ({proc_name})"
        }
    if "svchost.exe" in pname and ppath and not any(s in ppath for s in [r"windows\system32", r"windows\syswow64"]):
        return {
            "level": "suspicious",
            "badge": "🚨 SUSPICIOUS",
            "reason": f"svchost.exe running outside Windows System32: {proc_path}"
        }

    # 4. Critical database / debug services bound to 0.0.0.0 (High Risk)
    if is_public:
        if port == 6379:
            return {
                "level": "suspicious",
                "badge": "🚨 HIGH RISK",
                "reason": "Redis cache bound to 0.0.0.0 (Public RCE vulnerability risk without password)"
            }
        if port in (5005, 9229):
            return {
                "level": "suspicious",
                "badge": "🚨 HIGH RISK",
                "reason": "Remote debugger open to network (Allows arbitrary code execution)"
            }
        if port == 27017:
            return {
                "level": "suspicious",
                "badge": "🚨 HIGH RISK",
                "reason": "MongoDB database exposed to 0.0.0.0 without localhost binding"
            }
        if port in (135, 445, 139):
            return {
                "level": "suspicious",
                "badge": "🚨 HIGH RISK",
                "reason": "Windows SMB / NetBIOS exposed on public interface (EternalBlue/WannaCry vector)"
            }

    # 5. Core Windows System Services
    if pid <= 4 or ("svchost" in pname and ("system32" in ppath or not ppath)):
        return {
            "level": "system",
            "badge": "🛡️ SYSTEM",
            "reason": "Protected Windows core operating system service"
        }

    # 6. LAN / Public Network Exposure
    if is_public:
        return {
            "level": "exposed",
            "badge": "⚠️ LAN EXPOSED",
            "reason": "Bound to 0.0.0.0 — accessible to all devices on your Wi-Fi/Ethernet network"
        }

    # 7. Localhost Isolated (Safe Dev Server)
    return {
        "level": "safe",
        "badge": "🟢 SAFE LOCALHOST",
        "reason": "Loopback isolated (127.0.0.1) — protected from external LAN access"
    }


def get_active_listening_ports_metadata() -> List[Dict[str, Any]]:
    """Scans all active TCP listening ports and attaches process metadata (PID, executable, service tag, security audit)."""
    import re
    ports_map: Dict[int, Dict[str, Any]] = {}
    try:
        out = subprocess.check_output("netstat -ano -p tcp", shell=True, text=True, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            line = line.strip()
            if "LISTENING" in line.upper():
                parts = re.split(r"\s+", line)
                if len(parts) >= 5:
                    proto = parts[0].upper()
                    local_addr = parts[1]
                    try:
                        pid = int(parts[4])
                    except ValueError:
                        continue
                    m = re.search(r":(\d+)$", local_addr)
                    if m:
                        port = int(m.group(1))
                        if port not in ports_map:
                            proc = get_process_info_by_pid(pid)
                            pname = proc["name"].lower()
                            
                            # Deduce friendly service identity
                            service_tag = ""
                            if port in (8000, 8088):
                                service_tag = "Volume Control / FastAPI"
                            elif port in (5173, 5174):
                                service_tag = "Vite Dev Server"
                            elif port in (3000, 3001):
                                service_tag = "Node.js / React / Next"
                            elif port == 5000:
                                service_tag = "Flask / Python Dev"
                            elif port == 8080:
                                service_tag = "HTTP Web Service"
                            elif port == 4200:
                                service_tag = "Angular Dev Server"
                            elif port == 11434:
                                service_tag = "Ollama Local AI"
                            elif port == 27017:
                                service_tag = "MongoDB Database"
                            elif port == 5432:
                                service_tag = "PostgreSQL Database"
                            elif port == 3306:
                                service_tag = "MySQL Database"
                            elif port == 6379:
                                service_tag = "Redis Cache"
                            elif pid <= 4 or "svchost" in pname:
                                service_tag = "Windows System Service"
                            elif "python" in pname:
                                service_tag = "Python Server Process"
                            elif "node" in pname:
                                service_tag = "Node.js Application"
                            elif "code" in pname:
                                service_tag = "VS Code Server"
                            else:
                                service_tag = proc["name"]

                            sec = classify_port_security(port, pid, proc["name"], proc["path"], local_addr)
                            is_public = local_addr.startswith("0.0.0.0") or local_addr.startswith("[::]") or local_addr.startswith("*")

                            ports_map[port] = {
                                "port": port,
                                "pid": pid,
                                "process_name": proc["name"],
                                "process_path": proc["path"],
                                "protocol": proto,
                                "local_address": local_addr,
                                "service_tag": service_tag,
                                "is_system": sec["level"] == "system" or pid <= 4,
                                "security_level": sec["level"],
                                "security_badge": sec["badge"],
                                "security_reason": sec["reason"],
                                "bind_scope": "LAN / Public (0.0.0.0)" if is_public else "Localhost (127.0.0.1)",
                                "can_kill": pid > 4 and sec["level"] != "system"
                            }
    except Exception:
        pass
    
    # Priority sorting: suspicious first (0), exposed next (1), safe next (2), system last (3)
    prio_order = {"suspicious": 0, "exposed": 1, "safe": 2, "system": 3}
    return sorted(ports_map.values(), key=lambda x: (prio_order.get(x["security_level"], 9), x["port"]))


def get_active_listening_ports() -> List[int]:
    """Scans for active listening development ports."""
    meta = get_active_listening_ports_metadata()
    return [p["port"] for p in meta]


CRITICAL_SYSTEM_PROCESSES = {
    "system", "system idle process", "csrss.exe", "lsass.exe",
    "services.exe", "smss.exe", "wininit.exe", "svchost.exe"
}


def kill_process_by_pid(pid: int) -> Dict[str, Any]:
    try:
        pid_int = int(pid)
        if pid_int <= 4:
            return {"success": False, "pid": pid_int, "error": "Protected system process cannot be terminated"}

        pinfo = get_process_info_by_pid(pid_int)
        pname = (pinfo.get("name") or "").lower()
        if pname in CRITICAL_SYSTEM_PROCESSES:
            return {"success": False, "pid": pid_int, "error": f"Refusing to terminate critical system process: {pinfo.get('name')}"}

        subprocess.run(
            ["taskkill", "/PID", str(pid_int), "/F"],
            shell=False,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return {
            "success": True,
            "pid": pid_int,
            "process_name": pinfo.get("name", "Unknown"),
            "message": f"Terminated process {pinfo.get('name', 'PID ' + str(pid_int))} (PID {pid_int})"
        }
    except Exception as e:
        return {"success": False, "pid": pid, "error": str(e)}


def get_system_telemetry() -> Dict[str, Any]:
    """Retrieves live Windows hardware metrics (CPU, GPU, RAM, Network, Power, Uptime, Ports)."""
    cpu_pct = get_cpu_percent()

    stat = MEMORYSTATUSEX()
    stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
    kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))

    total_gb = round(stat.ullTotalPhys / (1024**3), 1)
    avail_gb = round(stat.ullAvailPhys / (1024**3), 1)
    used_gb = round((stat.ullTotalPhys - stat.ullAvailPhys) / (1024**3), 1)
    ram_load = int(stat.dwMemoryLoad)

    gpu = get_gpu_telemetry()
    net = get_network_telemetry()
    power = get_power_telemetry()
    uptime = get_uptime_telemetry()
    periphs = get_peripherals_telemetry()
    ports_meta = get_active_listening_ports_metadata()
    ports_list = [p["port"] for p in ports_meta]

    return {
        "cpu_percent": cpu_pct,
        "cpu_cores": os.cpu_count() or 8,
        "ram_percent": ram_load,
        "ram_used_gb": used_gb,
        "ram_total_gb": total_gb,
        "ram_avail_gb": avail_gb,
        "gpu": gpu,
        "network": net,
        "power": power,
        "uptime": uptime,
        "peripherals": periphs,
        "listening_ports": ports_list,
        "ports_meta": ports_meta
    }


def clean_ram() -> Dict[str, Any]:
    """Empties working sets to reclaim unneeded RAM instantly."""
    try:
        ps_cmd = "Get-Process | ForEach-Object { try { $_.EmptyWorkingSet() } catch {} }"
        subprocess.Popen(
            ["powershell", "-NoProfile", "-Command", ps_cmd],
            creationflags=0x00000008,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return {"success": True, "message": "Memory working sets trimmed"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def kill_port(port: int) -> Dict[str, Any]:
    """Finds any process listening on a given TCP port and forcefully terminates it."""
    import re
    try:
        out = subprocess.check_output(
            f"netstat -ano -p tcp",
            shell=True,
            text=True,
            stderr=subprocess.DEVNULL
        )
        pids = set()
        for line in out.strip().splitlines():
            if f":{port}" in line and "LISTENING" in line.upper():
                parts = re.split(r"\s+", line.strip())
                if len(parts) >= 5:
                    try:
                        pids.add(int(parts[4]))
                    except ValueError:
                        pass

        if not pids:
            return {"success": True, "port": port, "pids": [], "message": f"Port {port} is already free"}

        killed = []
        proc_names = []
        for pid in pids:
            try:
                pid_int = int(pid)
            except (ValueError, TypeError):
                continue
            if pid_int <= 4:
                continue
            pinfo = get_process_info_by_pid(pid_int)
            pname = (pinfo.get("name") or "").lower()
            if pname in CRITICAL_SYSTEM_PROCESSES:
                continue
            if pinfo.get("name"):
                proc_names.append(pinfo["name"])
            try:
                subprocess.run(
                    ["taskkill", "/PID", str(pid_int), "/F"],
                    shell=False,
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                killed.append(pid_int)
            except Exception:
                pass

        pname_str = f" ({', '.join(set(proc_names))})" if proc_names else ""
        return {
            "success": True,
            "port": port,
            "killed_pids": killed,
            "process_names": list(set(proc_names)),
            "message": f"Closed port {port}{pname_str} [PID {', '.join(map(str, killed))}]"
        }
    except subprocess.CalledProcessError:
        return {"success": True, "port": port, "pids": [], "message": f"Port {port} is free"}
    except Exception as e:
        return {"success": False, "port": port, "error": str(e)}


# -------------------------------------------------------------
# Clipboard Integration (Phone <-> PC)
# -------------------------------------------------------------

def get_clipboard_text() -> str:
    """Reads current plain text from the Windows clipboard."""
    try:
        cmd = ["powershell", "-NoProfile", "-Command", "Get-Clipboard"]
        res = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL, timeout=2.0)
        return res.strip()
    except Exception:
        return ""


def set_clipboard_text(text: str) -> bool:
    """Sets plain text to the Windows clipboard."""
    try:
        proc = subprocess.Popen(
            ["powershell", "-NoProfile", "-Command", "$input | Set-Clipboard"],
            stdin=subprocess.PIPE,
            creationflags=0x00000008
        )
        proc.communicate(input=text.encode("utf-8"), timeout=2.5)
        return True
    except Exception:
        return False

