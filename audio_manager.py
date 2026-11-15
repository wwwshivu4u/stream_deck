import json
import os
import subprocess
import time
from typing import Any, Dict, Optional

ENGINE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AudioEngine.exe")

_cache_time = 0.0
_cached_state: Optional[Dict[str, Any]] = None
CACHE_TTL = 0.1  # 100ms cache to debounce high-frequency slider events


def _execute(*args: str) -> Dict[str, Any]:
    global _cached_state, _cache_time

    if not os.path.exists(ENGINE_PATH):
        return {
            "master": {"volume": 100, "muted": False},
            "sessions": [],
            "error": f"AudioEngine.exe not found at {ENGINE_PATH}",
        }

    cmd = [ENGINE_PATH] + list(args)
    try:
        startupinfo = None
        if os.name == "nt":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = 0  # Hide console window

        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            startupinfo=startupinfo,
            timeout=3.0,
            encoding="utf-8",
            errors="replace",
        )

        output = proc.stdout.strip()
        if not output:
            return {"master": {"volume": 100, "muted": False}, "sessions": []}

        data = json.loads(output)
        return data
    except Exception as ex:
        print(f"[audio_manager._execute Error] {ex}")
        return {"master": {"volume": 100, "muted": False}, "sessions": [], "error": str(ex)}


def is_spotify_name(name: Optional[str], display_name: Optional[str] = None) -> bool:
    """Returns True if the given process name or window display name is Spotify."""
    n = (name or "").lower()
    d = (display_name or "").lower()
    return "spotify" in n or "spotify" in d


def is_spotify_pid(pid: int) -> bool:
    """Checks whether a given PID belongs to an active Spotify audio session."""
    global _cached_state
    if _cached_state and "sessions" in _cached_state:
        for s in _cached_state["sessions"]:
            if s.get("pid") == pid:
                return bool(s.get("isSpotify") or is_spotify_name(s.get("name"), s.get("displayName")))
    return False


def spotify_linear_to_perceptual(vol: float) -> int:
    """
    Converts Windows WASAPI linear amplitude (0..100) to Spotify's perceptual
    cubic volume slider curve (0..100).
    Spotify maps: amplitude = (slider / 100)^3
    Therefore: slider = 100 * (amplitude / 100)^(1/3)
    """
    if vol <= 0.0:
        return 0
    if vol >= 100.0:
        return 100
    return max(0, min(100, int(round(((vol / 100.0) ** (1.0 / 3.0)) * 100.0))))


def spotify_perceptual_to_linear(slider: float) -> float:
    """
    Converts Spotify's perceptual cubic volume slider position (0..100)
    to Windows WASAPI linear amplitude (0..100).
    amplitude = 100 * (slider / 100)^3
    """
    if slider <= 0.0:
        return 0.0
    if slider >= 100.0:
        return 100.0
    return max(0.0, min(100.0, ((slider / 100.0) ** 3.0) * 100.0))


def get_audio_state(force: bool = False) -> Dict[str, Any]:
    global _cached_state, _cache_time
    now = time.time()
    if not force and _cached_state and (now - _cache_time < CACHE_TTL):
        return _cached_state

    state = _execute("get")
    if "master" in state:
        if "sessions" in state and isinstance(state["sessions"], list):
            for s in state["sessions"]:
                if is_spotify_name(s.get("name"), s.get("displayName")):
                    s["isSpotify"] = True
                    # If AudioEngine hasn't calculated perceptual volume, compute it
                    if "rawVolume" not in s:
                        raw = float(s.get("volume", 0)) / 100.0
                        s["rawVolume"] = raw
                        s["volume"] = spotify_linear_to_perceptual(float(s.get("volume", 0)))
        _cached_state = state
        _cache_time = now
    elif _cached_state:
        return _cached_state
    return state


# Alias for backward compatibility
get_state = get_audio_state


def set_master_volume(volume: int) -> Dict[str, Any]:
    global _cached_state
    vol = max(0, min(100, int(volume)))
    res = _execute("set-master", str(vol))
    if _cached_state and "master" in _cached_state:
        _cached_state["master"]["volume"] = vol
    return res


def set_master_mute(muted: Optional[bool] = None) -> Dict[str, Any]:
    global _cached_state
    arg = "toggle"
    if muted is not None:
        arg = "true" if muted else "false"
    res = _execute("mute-master", arg)
    if _cached_state and "master" in _cached_state and "muted" in res:
        _cached_state["master"]["muted"] = res["muted"]
    return res


def set_app_volume(pid: int, volume: int) -> Dict[str, Any]:
    global _cached_state
    vol = max(0, min(100, int(volume)))
    is_spotify = is_spotify_pid(pid)
    
    cmd_args = ["set-app", str(pid), str(vol)]
    if is_spotify:
        cmd_args.append("cubic")

    res = _execute(*cmd_args)
    if _cached_state and "sessions" in _cached_state:
        for s in _cached_state["sessions"]:
            if s.get("pid") == pid:
                s["volume"] = vol
                if is_spotify:
                    s["isSpotify"] = True
                    s["rawVolume"] = round(((vol / 100.0) ** 3.0), 4)
    return res


def set_app_mute(pid: int, muted: Optional[bool] = None) -> Dict[str, Any]:
    global _cached_state
    arg = "toggle"
    if muted is not None:
        arg = "true" if muted else "false"
    res = _execute("mute-app", str(pid), arg)
    if _cached_state and "sessions" in _cached_state and "muted" in res:
        for s in _cached_state["sessions"]:
            if s.get("pid") == pid:
                s["muted"] = res["muted"]
    return res


def get_mic_state() -> Dict[str, Any]:
    return _execute("get-mic")


def set_mic_mute(muted: Optional[bool] = None) -> Dict[str, Any]:
    global _cached_state
    arg = "toggle"
    if muted is not None:
        arg = "true" if muted else "false"
    res = _execute("mute-mic", arg)
    if _cached_state and "mic" in _cached_state and "muted" in res:
        _cached_state["mic"]["muted"] = res["muted"]
    return res

