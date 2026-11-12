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
