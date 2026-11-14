"""
Windows App Launcher Module
Scans Windows Start Menu shortcuts and standard Windows tools,
allowing the mobile/web interface to launch applications on PC like the Windows Start Menu.
"""

import os
import subprocess
from typing import Any, Dict, List, Optional

BUILTIN_APPS = [
    {"name": "Calculator", "target": "calc:", "icon": "🧮", "category": "Utilities", "desc": "Windows Calculator"},
    {"name": "Notepad", "target": "notepad.exe", "icon": "📝", "category": "Utilities", "desc": "Text Editor"},
    {"name": "Task Manager", "target": "taskmgr", "icon": "📊", "category": "System", "desc": "Performance & Processes"},
    {"name": "Windows Settings", "target": "ms-settings:", "icon": "⚙️", "category": "System", "desc": "PC Preferences"},
    {"name": "File Explorer", "target": "explorer.exe", "icon": "📁", "category": "System", "desc": "Browse Files & Drives"},
    {"name": "Command Prompt", "target": "cmd.exe", "icon": "💻", "category": "Developer", "desc": "Windows CMD Console"},
    {"name": "PowerShell", "target": "powershell.exe", "icon": "⚡", "category": "Developer", "desc": "PowerShell Core"},
    {"name": "Windows Terminal", "target": "wt.exe", "icon": "🖥️", "category": "Developer", "desc": "Modern Terminal"},
    {"name": "Google Chrome", "target": "chrome", "icon": "🌐", "category": "Web", "desc": "Web Browser"},
    {"name": "Microsoft Edge", "target": "msedge", "icon": "🌐", "category": "Web", "desc": "Web Browser"},
    {"name": "Discord", "target": "discord:", "icon": "💬", "category": "Communication", "desc": "Chat & Calls"},
    {"name": "Spotify", "target": "spotify:", "icon": "🎵", "category": "Media", "desc": "Music Streaming"},
    {"name": "Steam", "target": "steam:", "icon": "🎮", "category": "Games", "desc": "Game Platform & Library"},
    {"name": "OBS Studio", "target": "obs64.exe", "icon": "🎥", "category": "Media", "desc": "Broadcast & Recording"},
    {"name": "VS Code", "target": "code", "icon": "👨‍💻", "category": "Developer", "desc": "Code Editor"},
]

IGNORE_KEYWORDS = [
    "uninstall", "help", "website", "documentation", "manual", "readme",
    "remove", "homepage", "release notes", "error reporter", "crash report"
]


def get_available_apps() -> List[Dict[str, Any]]:
    """Returns a list of all detected Windows applications and system tools."""
    apps_dict = {}

    # 1. Add Built-in System Apps
    for b in BUILTIN_APPS:
        key = b["name"].lower()
        apps_dict[key] = {
            "id": f"app_{len(apps_dict)}",
            "name": b["name"],
            "target": b["target"],
            "icon": b["icon"],
            "category": b["category"],
            "desc": b["desc"]
        }

    # 2. Scan Windows Start Menu Directories
    dirs = [
        os.path.expandvars(r"%ProgramData%\Microsoft\Windows\Start Menu\Programs"),
        os.path.expandvars(r"%AppData%\Microsoft\Windows\Start Menu\Programs")
    ]

    for d in dirs:
        if not os.path.exists(d):
            continue
        try:
            for root, _, files in os.walk(d):
                for f in files:
                    if f.lower().endswith(".lnk"):
                        name = f[:-4]
                        nl = name.lower()
                        if any(k in nl for k in IGNORE_KEYWORDS):
                            continue
                        if nl in apps_dict:
                            continue

                        # Guess icon & category
                        icon = "🪟"
                        cat = "Programs"
                        if any(w in nl for w in ["game", "steam", "epic", "ea", "fivem", "faceit", "riot", "blizzard"]):
                            icon = "🎮"
                            cat = "Games"
                        elif any(w in nl for w in ["code", "git", "studio", "dev", "terminal", "python", "sublime"]):
                            icon = "💻"
                            cat = "Developer"
                        elif any(w in nl for w in ["discord", "chat", "telegram", "slack", "signal", "teams", "zoom"]):
                            icon = "💬"
                            cat = "Communication"
                        elif any(w in nl for w in ["chrome", "edge", "firefox", "brave", "opera", "browser"]):
                            icon = "🌐"
                            cat = "Web"
                        elif any(w in nl for w in ["music", "spotify", "sound", "audio", "obs", "vlc", "media", "player"]):
                            icon = "🎵"
                            cat = "Media"
                        elif any(w in nl for w in ["photo", "paint", "adobe", "figma", "draw", "cad"]):
                            icon = "🎨"
                            cat = "Creative"

                        target_path = os.path.join(root, f)
                        apps_dict[nl] = {
                            "id": f"app_{len(apps_dict)}",
                            "name": name,
                            "target": target_path,
                            "icon": icon,
                            "category": cat,
                            "desc": "Windows Application"
                        }
        except Exception:
            pass

    # Sort: Built-in tools first, then alphabetical by name
    return sorted(list(apps_dict.values()), key=lambda x: (0 if x["category"] in ["Utilities", "System"] else 1, x["name"].lower()))


def launch_app(target: str) -> Dict[str, Any]:
    """Launches an application target on the Windows host."""
    if not target or not target.strip():
        return {"success": False, "error": "Target cannot be empty"}

    clean_target = target.strip()
    try:
        # Check if target is a file path
        if os.path.exists(clean_target):
            os.startfile(clean_target)
            return {"success": True, "message": f"Launched {os.path.basename(clean_target)}"}

        # Otherwise use os.startfile for protocol or cmd start
        try:
            os.startfile(clean_target)
            return {"success": True, "message": f"Launched {clean_target}"}
        except Exception:
            subprocess.Popen(
                ["cmd", "/c", "start", "", clean_target],
                creationflags=0x00000008,
                shell=False
            )
            return {"success": True, "message": f"Started {clean_target}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
