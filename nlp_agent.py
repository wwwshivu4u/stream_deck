"""
Local NLP Agent Module
Interprets spoken or typed natural language commands locally and triggers actions:
- OBS Studio ("start recording in OBS Studio")
- Discord ("mute mic in discord", "toggle deafen")
- Audio Mixer ("set volume to 40%", "mute spotify", "turn volume up")
- Multi-App Window Layout ("stack 3 apps vertically on my 2nd screen")
- App Launching ("open chrome", "launch steam")
- Media Controls ("pause music", "next song")
- Custom Shortcuts (fuzzy matching user's custom shortcuts)
"""

import json
import re
import time
import urllib.request
from typing import Any, Dict, Optional

import audio_manager
import shortcuts_manager
import system_controller


def normalize_text(text: str) -> str:
    t = text.lower().strip()
    t = re.sub(r"[^\w\s%]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def parse_volume_level(text: str) -> Optional[int]:
    """Extracts integer percentage 0-100 from phrases like 'set volume to 45%'."""
    m = re.search(r"\b(\d{1,3})\s*(?:%|percent)?\b", text)
    if m:
        val = int(m.group(1))
        return max(0, min(100, val))
    return None


def query_local_llm_for_action(raw_text: str) -> Optional[Dict[str, Any]]:
    """
    Attempts to prompt a local Ollama LLM (e.g. llama3, mistral, or phi3)
    to generate a Windows Quick Action JSON object from voice input on the go.
    Times out in 1.2s to prevent blocking local execution.
    """
    prompt = (
        "You are an AI assistant for a Windows PC controller. Convert the user's voice command "
        "into a valid JSON quick action object.\n"
        f"User voice command: \"{raw_text}\"\n\n"
        "Schema rules:\n"
        "- \"name\": concise display name (e.g. \"Launch Blender\", \"Stack 3 Apps\", \"Discord Mute\")\n"
        "- \"desc\": short description (e.g. \"Launches Blender 3D\", \"Tiles windows\")\n"
        "- \"icon\": one of [cube, globe, music, gamepad, code, terminal, layout_vertical, layout_horizontal, camera, lock, volume_off, mic_off, headphones, record, play_pause, desktop, cpu, folder, edit, sparkles, star]\n"
        "- \"color\": vibrant hex color (e.g. #3b82f6, #10b981, #8b5cf6, #ef4444, #f59e0b, #06b6d4, #ec4899)\n"
        "- \"type\": one of [command, window_layout, hotkey, obs_record, discord_deafen, lock_pc, mute_master]\n"
        "- \"payload\": dict with parameters (e.g. {\"cmd\": \"...\"} for command; {\"keys\": [\"win\",\"d\"]} for hotkey; {\"monitor\": 2, \"layout\": \"vertical\", \"apps\": [...]} for window_layout)\n\n"
        "Return ONLY a single valid JSON object. Do not wrap in markdown quotes or explanations."
    )
    for model in ["llama3", "mistral", "phi3", "qwen", "llama2"]:
        try:
            req = urllib.request.Request(
                "http://127.0.0.1:11434/api/generate",
                data=json.dumps({
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=1.2) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                ans = data.get("response", "").strip()
                if ans.startswith("```"):
                    ans = re.sub(r"^```(?:json)?\s*", "", ans)
                    ans = re.sub(r"\s*```$", "", ans)
                parsed = json.loads(ans)
                if isinstance(parsed, dict) and "name" in parsed and ("type" in parsed or "payload" in parsed):
                    return parsed
        except Exception:
            continue
    return None


def synthesize_action_from_voice(raw_text: str, query: str) -> Dict[str, Any]:
    """
    Intelligent local synthesis engine. Creates a rich Quick Action on the fly
    with 0ms latency, matching custom apps, multi-window monitor layouts,
    hotkeys, and system actions.
    """
    # 1. Custom Name Extraction (e.g. 'called ...', 'named ...')
    custom_name = None
    m_name = re.search(r"\b(?:called|named)\s+([a-zA-Z0-9_\-\s]+?)(?:\s+(?:to|for|with|on)|$)", raw_text, re.IGNORECASE)
    if m_name:
        custom_name = m_name.group(1).strip().title()

    # 2. Window Layout Stacking (e.g. 'stack 3 apps vertically on screen 2')
    if any(w in query for w in ["stack", "tile", "split screen", "window layout", "layout"]):
        monitor = 2 if any(m in query for m in ["2", "second", "portrait", "monitor 2", "screen 2"]) else 1
        layout = "horizontal" if any(h in query for h in ["horizontal", "side by side", "horizontally"]) else "vertical"

        # Detect apps in query
        detected_apps = []
        app_catalog = [
            ("notepad", "Notepad", "notepad.exe"),
            ("calculator", "Calculator", "calc.exe"),
            ("calc", "Calculator", "calc.exe"),
            ("command prompt", "Command Prompt", "cmd.exe"),
            ("cmd", "Command Prompt", "cmd.exe"),
            ("terminal", "Terminal", "wt.exe"),
            ("chrome", "Chrome", "chrome.exe"),
            ("spotify", "Spotify", "start spotify:"),
            ("discord", "Discord", "start discord:"),
            ("code", "VS Code", "code"),
            ("vscode", "VS Code", "code"),
        ]
        for kw, aname, acmd in app_catalog:
            if kw in query:
                if not any(a["name"] == aname for a in detected_apps):
                    detected_apps.append({"name": aname, "cmd": acmd, "match": kw})

        if not detected_apps:
            detected_apps = [
                {"name": "Notepad", "cmd": "notepad.exe", "match": "notepad"},
                {"name": "Calculator", "cmd": "calc.exe", "match": "calculator"},
                {"name": "Command Prompt", "cmd": "cmd.exe", "match": "cmd"}
            ]

        name = custom_name or f"Stack {len(detected_apps)} Apps (Screen {monitor})"
        return {
            "name": name,
            "desc": f"Tiles {len(detected_apps)} apps {layout}ly on Screen {monitor}",
            "icon": "layout_vertical" if layout == "vertical" else "layout_horizontal",
            "color": "#3b82f6",
            "type": "window_layout",
            "payload": {
                "monitor": monitor,
                "layout": layout,
                "apps": detected_apps
            }
        }

    # 3. OBS Studio
    if "obs" in query or "recording" in query or "record" in query:
        return {
            "name": custom_name or "OBS Record",
            "desc": "Starts or stops recording in OBS Studio",
            "icon": "record",
            "color": "#ef4444",
            "type": "obs_record",
            "payload": {}
        }

    # 4. Lock PC
    if "lock" in query and any(w in query for w in ["pc", "computer", "workstation", "screen", "windows"]):
        return {
            "name": custom_name or "Lock Windows PC",
            "desc": "Instantly locks your workstation",
            "icon": "lock",
            "color": "#f43f5e",
            "type": "lock_pc",
            "payload": {}
        }

    # 6. Master Mute
    if "mute" in query and any(w in query for w in ["master", "all", "everything", "audio", "sound"]):
        return {
            "name": custom_name or "Panic Mute All",
            "desc": "Instantly mutes Windows Master Audio",
            "icon": "volume_off",
            "color": "#dc2626",
            "type": "mute_master",
            "payload": {}
        }

    # 7. Media Playback Controls
    if any(w in query for w in ["play", "pause", "music", "song", "track"]):
        if any(w in query for w in ["next", "skip"]):
            return {
                "name": custom_name or "Next Track",
                "desc": "Skip to next music track",
                "icon": "next",
                "color": "#06b6d4",
                "type": "hotkey",
                "payload": {"keys": ["media_next"]}
            }
        elif any(w in query for w in ["previous", "prev", "last"]):
            return {
                "name": custom_name or "Previous Track",
                "desc": "Go back to previous track",
                "icon": "prev",
                "color": "#0ea5e9",
                "type": "hotkey",
                "payload": {"keys": ["media_prev"]}
            }
        else:
            return {
                "name": custom_name or "Play / Pause",
                "desc": "Toggle media playback",
                "icon": "play_pause",
                "color": "#10b981",
                "type": "hotkey",
                "payload": {"keys": ["media_play_pause"]}
            }

    # 8. Screenshot / Snipping Tool
    if any(w in query for w in ["screenshot", "snipping", "snip"]):
        return {
            "name": custom_name or "Snipping Tool",
            "desc": "Trigger Windows Snip & Sketch (Win+Shift+S)",
            "icon": "camera",
            "color": "#a855f7",
            "type": "hotkey",
            "payload": {"keys": ["win", "shift", "s"]}
        }

    # 9. Task Manager
    if "task manager" in query:
        return {
            "name": custom_name or "Task Manager",
            "desc": "Open Windows Task Manager (Ctrl+Shift+Esc)",
            "icon": "cpu",
            "color": "#ec4899",
            "type": "hotkey",
            "payload": {"keys": ["ctrl", "shift", "esc"]}
        }

    # 10. Show Desktop
    if "desktop" in query or "minimize all" in query:
        return {
            "name": custom_name or "Show Desktop",
            "desc": "Minimize all windows (Win+D)",
            "icon": "desktop",
            "color": "#f59e0b",
            "type": "hotkey",
            "payload": {"keys": ["win", "d"]}
        }

    # 11. Known Application Database
    apps_db = {
        "blender": {"name": "Launch Blender", "cmd": "blender", "icon": "cube", "color": "#f59e0b", "desc": "Launches Blender 3D creation suite"},
        "steam": {"name": "Open Steam", "cmd": "start steam:", "icon": "gamepad", "color": "#00adee", "desc": "Launches Steam gaming client"},
        "chrome": {"name": "Open Chrome", "cmd": "chrome.exe", "icon": "globe", "color": "#ea4335", "desc": "Launches Google Chrome browser"},
        "google chrome": {"name": "Open Chrome", "cmd": "chrome.exe", "icon": "globe", "color": "#ea4335", "desc": "Launches Google Chrome browser"},
        "spotify": {"name": "Open Spotify", "cmd": "start spotify:", "icon": "music", "color": "#1db954", "desc": "Launches Spotify music player"},
        "discord": {"name": "Open Discord", "cmd": "start discord:", "icon": "mic_off", "color": "#5865f2", "desc": "Launches Discord"},
        "vs code": {"name": "Open VS Code", "cmd": "code", "icon": "code", "color": "#007acc", "desc": "Launches Visual Studio Code"},
        "vscode": {"name": "Open VS Code", "cmd": "code", "icon": "code", "color": "#007acc", "desc": "Launches Visual Studio Code"},
        "terminal": {"name": "Open Terminal", "cmd": "wt.exe", "icon": "terminal", "color": "#334155", "desc": "Opens Windows Terminal"},
        "powershell": {"name": "PowerShell", "cmd": "powershell.exe", "icon": "terminal", "color": "#012456", "desc": "Opens Windows PowerShell"},
        "cmd": {"name": "Command Prompt", "cmd": "cmd.exe", "icon": "terminal", "color": "#1e293b", "desc": "Opens Command Prompt"},
        "notepad": {"name": "Open Notepad", "cmd": "notepad.exe", "icon": "edit", "color": "#64748b", "desc": "Opens Notepad text editor"},
        "calculator": {"name": "Open Calculator", "cmd": "calc.exe", "icon": "cpu", "color": "#0284c7", "desc": "Opens Windows Calculator"},
        "calc": {"name": "Open Calculator", "cmd": "calc.exe", "icon": "cpu", "color": "#0284c7", "desc": "Opens Windows Calculator"},
        "explorer": {"name": "File Explorer", "cmd": "explorer.exe", "icon": "folder", "color": "#f59e0b", "desc": "Opens Windows File Explorer"},
        "files": {"name": "File Explorer", "cmd": "explorer.exe", "icon": "folder", "color": "#f59e0b", "desc": "Opens Windows File Explorer"},
        "firefox": {"name": "Open Firefox", "cmd": "firefox.exe", "icon": "globe", "color": "#ff7139", "desc": "Opens Mozilla Firefox browser"},
        "figma": {"name": "Open Figma", "cmd": "start figma:", "icon": "sparkles", "color": "#a259ff", "desc": "Opens Figma design app"},
        "slack": {"name": "Open Slack", "cmd": "start slack:", "icon": "sparkles", "color": "#4a154b", "desc": "Opens Slack messaging client"}
    }

    for app_key, app_info in apps_db.items():
        if app_key in query:
            name = custom_name or app_info["name"]
            return {
                "name": name,
                "desc": app_info["desc"],
                "icon": app_info["icon"],
                "color": app_info["color"],
                "type": "command",
                "payload": {"cmd": app_info["cmd"]}
            }

    # 12. Web URLs (e.g. 'open https://youtube.com' or 'youtube.com')
    url_match = re.search(r"(https?://\S+|www\.\S+|\b[a-zA-Z0-9\-]+\.(?:com|org|net|io|tv|app)\b)", query)
    if url_match:
        url = url_match.group(1)
        if not url.startswith("http"):
            url = "https://" + url
        domain = re.sub(r"^https?://(?:www\.)?", "", url).split("/")[0].title()
        name = custom_name or f"Open {domain}"
        return {
            "name": name,
            "desc": f"Opens {url} in default browser",
            "icon": "globe",
            "color": "#3b82f6",
            "type": "command",
            "payload": {"cmd": f"start {url}"}
        }

    # 13. Dynamic App / Command Extraction fallback
    target_clean = re.sub(r"\b(?:add|create|make|new|quick|action|shortcut|button|to|for|called|named|launch|open|start|run|the)\b", "", query).strip()
    target_title = custom_name or (target_clean.title() if target_clean else "Custom Action")
    cmd_exec = f"start {target_clean}" if target_clean else "explorer.exe"

    return {
        "name": target_title if target_title.startswith(("Open ", "Launch ")) else f"Launch {target_title}",
        "desc": f"Launches {target_title}",
        "icon": "sparkles",
        "color": "#8b5cf6",
        "type": "command",
        "payload": {"cmd": cmd_exec}
    }


def handle_voice_action_management(raw_text: str, query: str) -> Optional[Dict[str, Any]]:
    """
    Handles voice-driven adding, editing/renaming, and removing of quick actions.
    The LLM / synthesis engine creates or updates the Action on the go.
    Returns response dict if handled, or None to fall through to normal execution.
    """
    # -------------------------------------------------------------
    # A. Delete / Remove Quick Action
    # -------------------------------------------------------------
    is_delete = any(k in query for k in [
        "delete shortcut", "delete quick action", "delete action", "delete button",
        "remove shortcut", "remove quick action", "remove action", "remove button",
        "delete the shortcut", "remove the shortcut", "delete the quick action", "remove the quick action"
    ]) or (query.startswith(("delete ", "remove ")) and any(w in query for w in ["shortcut", "action", "button", "tile"]))

    if is_delete:
        target = query
        for phrase in [
            "delete quick action called", "delete quick action named", "delete quick action for",
            "delete shortcut called", "delete shortcut named", "delete shortcut for",
            "delete the quick action", "delete the shortcut", "delete quick action", "delete shortcut",
            "remove quick action called", "remove quick action named", "remove quick action for",
            "remove the quick action", "remove the shortcut", "remove quick action", "remove shortcut",
            "delete action called", "delete action", "remove action called", "remove action",
            "delete button", "remove button", "delete", "remove"
        ]:
            if phrase in target:
                target = target.replace(phrase, "", 1)
        target = target.strip()
        target = re.sub(r"^(?:the|a|an)\s+", "", target).strip()

        found = shortcuts_manager.find_shortcut_by_name(target)
        if found:
            deleted_id = found.get("id")
            shortcuts_manager.delete_shortcut(deleted_id)
            updated_list = shortcuts_manager.load_shortcuts()
            return {
                "success": True,
                "intent": "delete_shortcut",
                "action": "delete",
                "message": f"Deleted quick action \"{found.get('name')}\"",
                "speech": f"Deleted quick action {found.get('name')}.",
                "shortcuts": updated_list,
                "data": {"id": deleted_id, "name": found.get("name")}
            }
        else:
            return {
                "success": False,
                "intent": "delete_shortcut",
                "action": "not_found",
                "message": f"Could not find quick action matching \"{target}\"",
                "speech": f"I couldn't find a quick action matching {target}.",
                "shortcuts": shortcuts_manager.load_shortcuts()
            }

    # -------------------------------------------------------------
    # B. Edit / Rename Quick Action
    # -------------------------------------------------------------
    is_rename = ("rename " in query and " to " in query) or \
                ("change " in query and (" to " in query or "name " in query) and ("shortcut" in query or "action" in query)) or \
                ("edit " in query and (" to " in query or "name " in query or "color " in query))

    if is_rename:
        if " to " in query:
            parts = query.split(" to ", 1)
            left_part = parts[0].strip()
            right_part = parts[1].strip()

            target = left_part
            for phrase in [
                "rename quick action called", "rename quick action", "rename shortcut called", "rename shortcut",
                "rename action called", "rename action", "rename the", "rename",
                "change quick action", "change shortcut", "change action", "change the name of", "change the", "change",
                "edit quick action", "edit shortcut", "edit action", "edit the", "edit"
            ]:
                if phrase in target:
                    target = target.replace(phrase, "", 1)
            target = re.sub(r"^(?:the|a|an)\s+", "", target).strip()
            target = re.sub(r"\bname\b", "", target).strip()

            found = shortcuts_manager.find_shortcut_by_name(target)
            if found:
                color_map = {
                    "red": "#ef4444", "blue": "#3b82f6", "green": "#10b981", "purple": "#8b5cf6",
                    "amber": "#f59e0b", "orange": "#f97316", "yellow": "#eab308", "cyan": "#06b6d4",
                    "pink": "#ec4899", "emerald": "#059669", "indigo": "#6366f1"
                }
                is_color_change = any(c in right_part for c in color_map) and ("color" in left_part or "color" in query)
                if is_color_change:
                    for c_name, c_hex in color_map.items():
                        if c_name in right_part:
                            found["color"] = c_hex
                            break
                    msg = f"Changed color of \"{found['name']}\""
                    speech = f"Updated color for {found['name']}."
                else:
                    new_name = right_part.strip().title()
                    old_name = found.get("name", "Shortcut")
                    found["name"] = new_name
                    msg = f"Renamed \"{old_name}\" to \"{new_name}\""
                    speech = f"Renamed to {new_name}."

                shortcuts_manager.create_or_update_shortcut(found)
                updated_list = shortcuts_manager.load_shortcuts()
                return {
                    "success": True,
                    "intent": "edit_shortcut",
                    "action": "edit",
                    "message": msg,
                    "speech": speech,
                    "shortcuts": updated_list,
                    "data": found
                }
            else:
                return {
                    "success": False,
                    "intent": "edit_shortcut",
                    "action": "not_found",
                    "message": f"Could not find quick action matching \"{target}\"",
                    "speech": f"I couldn't find a quick action matching {target}.",
                    "shortcuts": shortcuts_manager.load_shortcuts()
                }

    # -------------------------------------------------------------
    # C. Add / Create Quick Action on the Fly
    # -------------------------------------------------------------
    is_add = any(k in query for k in [
        "add quick action", "add a quick action", "add shortcut", "add a shortcut", "add action", "add an action",
        "create quick action", "create a quick action", "create shortcut", "create a shortcut", "create action", "create an action",
        "make quick action", "make shortcut", "make a shortcut", "make an action",
        "new quick action", "new shortcut", "new action"
    ]) or (query.startswith(("add ", "create ", "make ", "new ")) and any(w in query for w in ["action", "shortcut", "button", "tile"]))

    if is_add:
        # 1. Attempt to have local LLM generate the Action object on the go
        action_data = query_local_llm_for_action(raw_text)

        # 2. If local LLM is offline or timed out, synthesize with intelligent local engine
        if not action_data or not isinstance(action_data, dict) or not action_data.get("name"):
            action_data = synthesize_action_from_voice(raw_text, query)

        # Generate unique ID
        slug = re.sub(r"[^a-z0-9]+", "_", action_data.get("name", "custom").lower()).strip("_")
        action_id = f"act_{slug}_{int(time.time() * 1000) % 1000000}"
        action_data["id"] = action_id

        # Save to shortcuts manager
        shortcuts_manager.create_or_update_shortcut(action_data)
        updated_list = shortcuts_manager.load_shortcuts()

        return {
            "success": True,
            "intent": "create_shortcut",
            "action": "create",
            "message": f"Created quick action \"{action_data['name']}\"",
            "speech": f"Created quick action {action_data['name']}.",
            "shortcuts": updated_list,
            "created_shortcut": action_data
        }

    return None


def execute_nlp_command(raw_text: str) -> Dict[str, Any]:
    """
    Main entry point for natural language execution.
    Returns:
    {
        "success": bool,
        "intent": str,
        "action": str,
        "message": str,
        "speech": str (text for speech synthesis),
        "data": dict
    }
    """
    if not raw_text or not raw_text.strip():
        return {
            "success": False,
            "intent": "empty",
            "message": "No command heard.",
            "speech": "I didn't hear anything."
        }

    query = normalize_text(raw_text)

    # -------------------------------------------------------------
    # 0. Voice-Prompt Quick Actions Management (Add, Edit, Delete)
    # The LLM / Synthesizer creates or updates actions on the go
    # -------------------------------------------------------------
    action_mgmt_res = handle_voice_action_management(raw_text, query)
    if action_mgmt_res is not None:
        return action_mgmt_res

    # -------------------------------------------------------------
    # 1. OBS Studio Controls
    # -------------------------------------------------------------
    if "obs" in query or "recording" in query or "stream" in query:
        if any(w in query for w in ["start recording", "record in obs", "start record", "record obs", "start recording in obs studio"]):
            res = system_controller.trigger_obs_record(action="start")
            msg = res.get("message", "Started recording in OBS Studio")
            return {
                "success": True,
                "intent": "obs_record",
                "action": "start_recording",
                "message": msg,
                "speech": "Started recording in OBS Studio.",
                "data": res
            }
        elif any(w in query for w in ["stop recording", "end recording", "finish recording"]):
            res = system_controller.trigger_obs_record(action="stop")
            msg = res.get("message", "Stopped recording in OBS Studio")
            return {
                "success": True,
                "intent": "obs_record",
                "action": "stop_recording",
                "message": msg,
                "speech": "Stopped recording in OBS Studio.",
                "data": res
            }
        elif "recording" in query or "record" in query:
            res = system_controller.trigger_obs_record(action="toggle")
            msg = res.get("message", "Toggled OBS Studio recording")
            return {
                "success": True,
                "intent": "obs_record",
                "action": "toggle_recording",
                "message": msg,
                "speech": "Toggled OBS Studio recording.",
                "data": res
            }

    # -------------------------------------------------------------
    # 2. Window Layout & Stacking (e.g. 3 Apps on Screen 2)
    # -------------------------------------------------------------
    if "stack" in query or "tile" in query or ("screen 2" in query and "open" in query) or "2nd screen" in query:
        # Check if target is Screen 2
        monitor_idx = 2 if ("2" in query or "second" in query) else 1
        res = shortcuts_manager.run_shortcut("stack_screen_2")
        return {
            "success": True,
            "intent": "window_stack",
            "action": "stack_apps",
            "message": f"Opened and stacked 3 apps vertically on Screen {monitor_idx}",
            "speech": f"Stacked 3 apps vertically on screen {monitor_idx}.",
            "data": res
        }

    # -------------------------------------------------------------
    # 4. Audio Volume & Mute Controls
    # -------------------------------------------------------------
    # Master volume adjustments
    if "volume" in query or "sound" in query:
        # Check volume up / down
        if "up" in query or "increase" in query or "raise" in query or "louder" in query:
            cur = audio_manager.get_audio_state().get("master", {}).get("volume", 50)
            nv = min(100, cur + 10)
            audio_manager.set_master_volume(nv)
            return {
                "success": True,
                "intent": "audio_volume",
                "action": "volume_up",
                "message": f"Increased master volume to {nv}%",
                "speech": f"Volume raised to {nv} percent.",
                "data": {"volume": nv}
            }
        elif "down" in query or "decrease" in query or "lower" in query or "softer" in query or "quieter" in query:
            cur = audio_manager.get_audio_state().get("master", {}).get("volume", 50)
            nv = max(0, cur - 10)
            audio_manager.set_master_volume(nv)
            return {
                "success": True,
                "intent": "audio_volume",
                "action": "volume_down",
                "message": f"Decreased master volume to {nv}%",
                "speech": f"Volume lowered to {nv} percent.",
                "data": {"volume": nv}
            }

        # Absolute volume percentage: "set volume to 60%"
        vol = parse_volume_level(query)
        if vol is not None:
            # Check if for a specific app
            target_app = None
            state = audio_manager.get_audio_state()
            for s in state.get("sessions", []):
                sname = s.get("name", "").lower()
                sdname = s.get("displayName", "").lower()
                if (sname and sname in query) or (sdname and sdname in query):
                    target_app = s
                    break

            if target_app:
                audio_manager.set_app_volume(target_app["pid"], vol)
                name = target_app.get("displayName") or target_app["name"]
                return {
                    "success": True,
                    "intent": "app_volume",
                    "action": "set_volume",
                    "message": f"Set {name} volume to {vol}%",
                    "speech": f"Set {name} volume to {vol} percent.",
                    "data": {"app": name, "volume": vol}
                }
            else:
                audio_manager.set_master_volume(vol)
                return {
                    "success": True,
                    "intent": "master_volume",
                    "action": "set_volume",
                    "message": f"Set master volume to {vol}%",
                    "speech": f"Set master volume to {vol} percent.",
                    "data": {"volume": vol}
                }

    # 4. Discord Deafen controls (Ctrl + F1)
    if "deafen" in query or "undeafen" in query:
        system_controller.send_hotkey(["ctrl", "f1"])
        return {
            "success": True,
            "intent": "discord_deafen",
            "action": "deafen",
            "message": "Toggled Discord Deafen (Ctrl+F1)",
            "speech": "Toggled Discord deafen.",
            "data": {"hotkey": "Ctrl+F1"}
        }

    # Mute / Unmute controls
    if "mute" in query or "unmute" in query:
        should_mute = "unmute" not in query
        state = audio_manager.get_audio_state()
        target_app = None
        for s in state.get("sessions", []):
            sname = s.get("name", "").lower()
            sdname = s.get("displayName", "").lower()
            if (sname and sname in query) or (sdname and sdname in query):
                target_app = s
                break

        if target_app:
            audio_manager.set_app_mute(target_app["pid"], should_mute)
            action_word = "Muted" if should_mute else "Unmuted"
            name = target_app.get("displayName") or target_app["name"]
            return {
                "success": True,
                "intent": "app_mute",
                "action": "mute" if should_mute else "unmute",
                "message": f"{action_word} {name}",
                "speech": f"{action_word} {name}.",
                "data": {"app": name, "muted": should_mute}
            }
        else:
            # Check if user targeted a specific app that isn't running or playing audio
            stop_words = {"mute", "unmute", "please", "can", "you", "the", "my", "to", "on", "off"}
            master_synonyms = {"master", "pc", "all", "everything", "system", "volume", "sound", "computer", "audio", "speaker", "speakers"}
            query_tokens = [w for w in re.sub(r'[^a-zA-Z0-9\s]', ' ', query).split() if w not in stop_words]
            if query_tokens and not any(t in master_synonyms for t in query_tokens):
                target_name = " ".join(query_tokens).title()
                return {
                    "success": False,
                    "intent": "app_mute",
                    "action": "not_found",
                    "message": f"No active audio session found for '{target_name}'. Open the app or start playback first.",
                    "speech": f"No active audio session found for {target_name}.",
                    "data": {"query": query}
                }

            audio_manager.set_master_mute(should_mute)
            action_word = "Muted" if should_mute else "Unmuted"
            return {
                "success": True,
                "intent": "master_mute",
                "action": "mute" if should_mute else "unmute",
                "message": f"{action_word} Master audio",
                "speech": f"{action_word} master audio.",
                "data": {"muted": should_mute}
            }

    # -------------------------------------------------------------
    # 5. Media Playback Controls
    # -------------------------------------------------------------
    if any(w in query for w in ["play music", "pause music", "pause playback", "resume music", "play song"]):
        system_controller.send_hotkey(["media_play_pause"])
        return {
            "success": True,
            "intent": "media",
            "action": "play_pause",
            "message": "Toggled media playback",
            "speech": "Playback toggled.",
            "data": {}
        }
    elif any(w in query for w in ["next song", "next track", "skip song", "skip track"]):
        system_controller.send_hotkey(["media_next"])
        return {
            "success": True,
            "intent": "media",
            "action": "next_track",
            "message": "Skipped to next track",
            "speech": "Next track.",
            "data": {}
        }
    elif any(w in query for w in ["previous song", "previous track", "last song"]):
        system_controller.send_hotkey(["media_prev"])
        return {
            "success": True,
            "intent": "media",
            "action": "previous_track",
            "message": "Returned to previous track",
            "speech": "Previous track.",
            "data": {}
        }

    # -------------------------------------------------------------
    # 6. System & Desktop Quick Actions
    # -------------------------------------------------------------
    if "lock" in query and ("pc" in query or "computer" in query or "screen" in query or "windows" in query):
        system_controller.lock_workstation()
        return {
            "success": True,
            "intent": "system_lock",
            "action": "lock_pc",
            "message": "Locked Windows PC",
            "speech": "Workstation locked.",
            "data": {}
        }

    if "screenshot" in query or "snipping" in query or "snip" in query:
        system_controller.send_hotkey(["win", "shift", "s"])
        return {
            "success": True,
            "intent": "system_hotkey",
            "action": "screenshot",
            "message": "Opened Snipping Tool (Win+Shift+S)",
            "speech": "Snipping tool opened.",
            "data": {}
        }

    if "task manager" in query:
        system_controller.send_hotkey(["ctrl", "shift", "esc"])
        return {
            "success": True,
            "intent": "system_hotkey",
            "action": "task_manager",
            "message": "Opened Task Manager (Ctrl+Shift+Esc)",
            "speech": "Task manager opened.",
            "data": {}
        }

    if "desktop" in query or "minimize all" in query:
        system_controller.send_hotkey(["win", "d"])
        return {
            "success": True,
            "intent": "system_hotkey",
            "action": "show_desktop",
            "message": "Toggled Show Desktop (Win+D)",
            "speech": "Showing desktop.",
            "data": {}
        }

    # -------------------------------------------------------------
    # 7. Application Launching / Closing
    # -------------------------------------------------------------
    launch_match = re.search(r"\b(?:open|launch|start)\s+([a-zA-Z0-9_\-\s]+)", query)
    if launch_match:
        target = launch_match.group(1).strip()
        common_apps = {
            "chrome": "start chrome",
            "google chrome": "start chrome",
            "spotify": "start spotify:",
            "discord": "start discord:",
            "steam": "start steam:",
            "notepad": "notepad.exe",
            "calculator": "calc.exe",
            "terminal": "wt.exe",
            "cmd": "start cmd.exe",
            "obs": "start \"\" \"C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\OBS Studio.lnk\"",
            "obs studio": "start \"\" \"C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\OBS Studio.lnk\"",
            "vs code": "code",
            "vscode": "code",
            "explorer": "explorer.exe",
            "file explorer": "explorer.exe"
        }
        for k, cmd in common_apps.items():
            if k in target:
                system_controller.run_system_command(cmd)
                return {
                    "success": True,
                    "intent": "app_launch",
                    "action": "launch",
                    "message": f"Opening {k.title()}",
                    "speech": f"Opening {k.title()}.",
                    "data": {"command": cmd}
                }

    # -------------------------------------------------------------
    # 7. Custom Shortcuts Matching
    # -------------------------------------------------------------
    shortcuts = shortcuts_manager.load_shortcuts()
    for s in shortcuts:
        sname = normalize_text(s.get("name", ""))
        if sname and (sname in query or query in sname):
            res = shortcuts_manager.run_shortcut(s["id"])
            return {
                "success": True,
                "intent": "custom_shortcut",
                "action": "run_shortcut",
                "message": f"Triggered shortcut: {s['name']}",
                "speech": f"Triggered {s['name']}.",
                "data": res
            }

    # -------------------------------------------------------------
    # 8. Optional Local Ollama Fallback (if Ollama is running)
    # -------------------------------------------------------------
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:11434/api/generate",
            data=json.dumps({
                "model": "llama3",
                "prompt": f"Respond in 1 short sentence as a PC desktop assistant: {raw_text}",
                "stream": False
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            ans = data.get("response", "").strip()
            if ans:
                return {
                    "success": True,
                    "intent": "ollama_conversation",
                    "action": "chat",
                    "message": ans,
                    "speech": ans,
                    "data": data
                }
    except Exception:
        pass

    # Default Unrecognized Fallback with Suggestions
    return {
        "success": False,
        "intent": "unrecognized",
        "action": "none",
        "message": f"I heard: \"{raw_text}\". Try saying: 'start recording in OBS', 'mute Discord', 'set volume to 50%', or 'stack 3 apps on 2nd screen'.",
        "speech": "I couldn't match that command. Try saying: start recording in OBS, or mute Discord."
    }

