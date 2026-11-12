"""
Shortcuts & Macros Manager
Manages customizable shortcuts stored in shortcuts.json.
Allows triggering PC commands, hotkeys, and window layouts from mobile/web.
"""

import json
import os
from typing import Any, Dict, List, Optional
import system_controller

SHORTCUTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shortcuts.json")

SUGGESTED_SHORTCUTS = [
    {
        "id": "stack_screen_2",
        "name": "Stack 3 Apps (Screen 2)",
        "desc": "Opens & tiles 3 apps vertically on your 2nd portrait monitor",
        "icon": "layout_vertical",
        "color": "#3b82f6",
        "type": "window_layout",
        "payload": {
            "monitor": 2,
            "layout": "vertical",
            "apps": [
                {"name": "Notepad", "cmd": "notepad.exe", "match": "notepad"},
                {"name": "Calculator", "cmd": "calc.exe", "match": "calculator"},
                {"name": "Command Prompt", "cmd": "cmd.exe", "match": "cmd"}
            ]
        }
    },
    {
        "id": "dual_apps_screen_1",
        "name": "Dual Apps (Screen 1)",
        "desc": "Splits Screen 1 horizontally with 2 side-by-side apps",
        "icon": "layout_horizontal",
        "color": "#2563eb",
        "type": "window_layout",
        "payload": {
            "monitor": 1,
            "layout": "horizontal",
            "apps": [
                {"name": "Notepad", "cmd": "notepad.exe", "match": "notepad"},
                {"name": "Calculator", "cmd": "calc.exe", "match": "calculator"}
            ]
        }
    },
    {
        "id": "obs_record",
        "name": "OBS Record",
        "desc": "Starts or stops recording in OBS Studio",
        "icon": "record",
        "color": "#ef4444",
        "type": "obs_record",
        "payload": {}
    },
    {
        "id": "discord_mute",
        "name": "Discord Mute",
        "desc": "Toggles microphone mute in Discord (Ctrl+Shift+M)",
        "icon": "mic_off",
        "color": "#5865f2",
        "type": "hotkey",
        "payload": {"keys": ["ctrl", "shift", "m"]}
    },
    {
        "id": "discord_deafen",
        "name": "Discord Deafen",
        "desc": "Toggles deafen in Discord (Ctrl+Shift+D)",
        "icon": "headphones",
        "color": "#8b5cf6",
        "type": "hotkey",
        "payload": {"keys": ["ctrl", "shift", "d"]}
    },
    {
        "id": "media_play_pause",
        "name": "Play / Pause",
        "desc": "Toggle music or video playback",
        "icon": "play_pause",
        "color": "#10b981",
        "type": "hotkey",
        "payload": {"keys": ["media_play_pause"]}
    },
    {
        "id": "media_next",
        "name": "Next Track",
        "desc": "Skip to next music track",
        "icon": "next",
        "color": "#06b6d4",
        "type": "hotkey",
        "payload": {"keys": ["media_next"]}
    },
    {
        "id": "media_prev",
        "name": "Previous Track",
        "desc": "Go back to previous music track",
        "icon": "prev",
        "color": "#0ea5e9",
        "type": "hotkey",
        "payload": {"keys": ["media_prev"]}
    },
    {
        "id": "show_desktop",
        "name": "Show Desktop",
        "desc": "Minimize all windows (Win+D)",
        "icon": "desktop",
        "color": "#f59e0b",
        "type": "hotkey",
        "payload": {"keys": ["win", "d"]}
    },
    {
        "id": "lock_pc",
        "name": "Lock Windows PC",
        "desc": "Instantly locks your workstation",
        "icon": "lock",
        "color": "#f43f5e",
        "type": "lock_pc",
        "payload": {}
    },
    {
        "id": "take_screenshot",
        "name": "Snipping Tool",
        "desc": "Trigger Windows Snip & Sketch (Win+Shift+S)",
        "icon": "camera",
        "color": "#a855f7",
        "type": "hotkey",
        "payload": {"keys": ["win", "shift", "s"]}
    },
    {
        "id": "task_manager",
        "name": "Task Manager",
        "desc": "Open Windows Task Manager (Ctrl+Shift+Esc)",
        "icon": "cpu",
        "color": "#ec4899",
        "type": "hotkey",
        "payload": {"keys": ["ctrl", "shift", "esc"]}
    },
    {
        "id": "mute_all",
        "name": "Panic Mute All",
        "desc": "Instantly mutes Windows Master Audio",
        "icon": "volume_off",
        "color": "#dc2626",
        "type": "mute_master",
        "payload": {}
    },
    {
        "id": "launch_chrome",
        "name": "Open Chrome",
        "desc": "Launches Google Chrome browser",
        "icon": "globe",
        "color": "#ea4335",
        "type": "command",
        "payload": {"cmd": "chrome.exe"}
    },
    {
        "id": "launch_spotify",
        "name": "Open Spotify",
        "desc": "Launches Spotify music player",
        "icon": "music",
        "color": "#1db954",
        "type": "command",
        "payload": {"cmd": "spotify.exe"}
    },
    {
        "id": "launch_steam",
        "name": "Open Steam",
        "desc": "Launches Steam gaming client",
        "icon": "gamepad",
        "color": "#00adee",
        "type": "command",
        "payload": {"cmd": "steam.exe"}
    }
]

DEFAULT_SHORTCUTS = SUGGESTED_SHORTCUTS[:7]


def get_suggested_shortcuts() -> List[Dict[str, Any]]:
    return SUGGESTED_SHORTCUTS


def load_shortcuts() -> List[Dict[str, Any]]:
    if not os.path.exists(SHORTCUTS_FILE):
        save_shortcuts(DEFAULT_SHORTCUTS)
        return DEFAULT_SHORTCUTS
    try:
        with open(SHORTCUTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return DEFAULT_SHORTCUTS
    except Exception as e:
        print(f"[Shortcuts Load Error] {e}")
        return DEFAULT_SHORTCUTS


def save_shortcuts(shortcuts: List[Dict[str, Any]]) -> bool:
    try:
        with open(SHORTCUTS_FILE, "w", encoding="utf-8") as f:
            json.dump(shortcuts, f, indent=2)
        return True
    except Exception as e:
        print(f"[Shortcuts Save Error] {e}")
        return False


def get_shortcut_by_id(shortcut_id: str) -> Optional[Dict[str, Any]]:
    shortcuts = load_shortcuts()
    for s in shortcuts:
        if s.get("id") == shortcut_id:
            return s
    return None


def find_shortcut_by_name(query_name: str) -> Optional[Dict[str, Any]]:
    if not query_name:
        return None
    q = query_name.lower().strip()
    shortcuts = load_shortcuts()
    # 1. Exact match
    for s in shortcuts:
        if s.get("name", "").lower() == q or s.get("id", "").lower() == q:
            return s
    # 2. Substring match
    for s in shortcuts:
        name_l = s.get("name", "").lower()
        if q in name_l or name_l in q:
            return s
    # 3. Word overlap match
    q_words = set(q.split()) - {"shortcut", "action", "the", "button", "quick", "to", "for"}
    best_match = None
    max_overlap = 0
    for s in shortcuts:
        s_words = set(s.get("name", "").lower().split())
        overlap = len(q_words & s_words)
        if overlap > max_overlap and overlap > 0:
            max_overlap = overlap
            best_match = s
    return best_match


def run_shortcut(shortcut_id: str) -> Dict[str, Any]:
    s = get_shortcut_by_id(shortcut_id)
    if not s:
        return {"success": False, "error": f"Shortcut '{shortcut_id}' not found"}

    stype = s.get("type") or s.get("action_type") or "command"
    payload = s.get("payload") or {}

    if stype == "hotkey":
        keys = payload.get("keys") or s.get("keys") or []
        success = system_controller.send_hotkey(keys)
        return {
            "success": success,
            "shortcut": s["name"],
            "message": f"Triggered hotkey: {'+'.join(keys).upper()}"
        }

    elif stype in ("window_layout", "stack_apps"):
        monitor_idx = payload.get("monitor") or s.get("target_screen") or s.get("monitor") or 2
        layout = payload.get("layout") or s.get("layout") or "vertical"
        apps = payload.get("apps") or s.get("apps") or []
        res = system_controller.launch_and_stack_apps(apps, monitor_index=monitor_idx, layout=layout)
        return {
            "success": res.get("success", False),
            "shortcut": s["name"],
            "details": res,
            "message": f"Arranged {len(apps)} apps on Monitor {monitor_idx} ({layout})"
        }

    elif stype == "obs_record":
        res = system_controller.trigger_obs_record()
        return {
            "success": res.get("success", False),
            "shortcut": s["name"],
            "details": res,
            "message": res.get("message", "Triggered OBS recording")
        }

    elif stype == "discord_mute":
        res = system_controller.toggle_discord_mute()
        return {
            "success": res,
            "shortcut": s["name"],
            "message": "Toggled Discord microphone mute"
        }

    elif stype == "discord_deafen":
        res = system_controller.toggle_discord_deafen()
        return {
            "success": res,
            "shortcut": s["name"],
            "message": "Toggled Discord deafen"
        }

    elif stype == "lock_pc":
        success = system_controller.lock_workstation()
        return {
            "success": success,
            "shortcut": s["name"],
            "message": "Locked Windows PC"
        }

    elif stype == "mute_master":
        import audio_manager
        audio_manager.set_master_mute(True)
        return {
            "success": True,
            "shortcut": s["name"],
            "message": "Muted Master Audio"
        }

    elif stype == "command":
        cmd = payload.get("cmd") or s.get("command") or s.get("cmd") or ""
        if cmd:
            res = system_controller.run_system_command(cmd)
            return {
                "success": res.get("success", False),
                "shortcut": s["name"],
                "message": f"Executed command: {cmd}"
            }
        return {"success": False, "error": "No command specified"}

    return {"success": False, "error": f"Unknown shortcut type: {stype}"}


def reorder_shortcuts(ordered_ids: List[str]) -> List[Dict[str, Any]]:
    shortcuts = load_shortcuts()
    id_map = {s.get("id"): s for s in shortcuts}
    new_list = []
    for sid in ordered_ids:
        if sid in id_map:
            new_list.append(id_map.pop(sid))
    for remaining in id_map.values():
        new_list.append(remaining)
    save_shortcuts(new_list)
    return new_list


def save_all_shortcuts(new_shortcuts: List[Dict[str, Any]]) -> bool:
    return save_shortcuts(new_shortcuts)


def create_or_update_shortcut(data: Dict[str, Any]) -> Dict[str, Any]:
    shortcuts = load_shortcuts()
    sid = data.get("id") or f"custom_{int(os.times().system * 1000)}"
    data["id"] = sid

    found = False
    for i, item in enumerate(shortcuts):
        if item.get("id") == sid:
            shortcuts[i] = data
            found = True
            break

    if not found:
        shortcuts.append(data)

    save_shortcuts(shortcuts)
    return {"success": True, "shortcut": data}


def delete_shortcut(shortcut_id: str) -> bool:
    shortcuts = load_shortcuts()
    new_list = [s for s in shortcuts if s.get("id") != shortcut_id]
    if len(new_list) != len(shortcuts):
        save_shortcuts(new_list)
        return True
    return False
