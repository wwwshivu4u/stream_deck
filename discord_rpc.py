"""
Discord Local RPC Native Integration
Connects directly to the Discord Desktop client via its local RPC WebSocket (port 6463-6472).
Enables native querying and updating of voice settings (Mic Mute, Deafen, Input/Output Volume)
without relying solely on simulated keystrokes.
"""

import json
import os
import socket
import threading
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "discord_rpc.json")


def build_ws_frame(data_str: str) -> bytes:
    """Encodes a string into a client-to-server masked WebSocket frame (RFC 6455)."""
    payload = data_str.encode("utf-8")
    length = len(payload)
    mask = os.urandom(4)
    if length <= 125:
        header = bytearray([0x81, 0x80 | length]) + mask
    elif length <= 65535:
        header = bytearray([0x81, 0x80 | 126, (length >> 8) & 0xFF, length & 0xFF]) + mask
    else:
        header = bytearray([0x81, 0x80 | 127]) + length.to_bytes(8, "big") + mask
    masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
    return bytes(header + masked)


def recv_exact(sock: socket.socket, n: int) -> bytes:
    """Reads exactly n bytes from a socket."""
    buf = bytearray()
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise ConnectionResetError("Socket closed")
        buf.extend(chunk)
    return bytes(buf)


def read_ws_frame(sock: socket.socket) -> Optional[Dict[str, Any]]:
    """Decodes a server-to-client unmasked WebSocket frame."""
    try:
        h = recv_exact(sock, 2)
        opcode = h[0] & 0x0F
        if opcode == 0x08:  # Close frame
            return None
        is_masked = bool(h[1] & 0x80)
        length = h[1] & 0x7F
        if length == 126:
            length = int.from_bytes(recv_exact(sock, 2), "big")
        elif length == 127:
            length = int.from_bytes(recv_exact(sock, 8), "big")
        mask = recv_exact(sock, 4) if is_masked else None
        raw_payload = recv_exact(sock, length)
        if is_masked:
            raw_payload = bytes(b ^ mask[i % 4] for i, b in enumerate(raw_payload))
        text = raw_payload.decode("utf-8", errors="replace")
        return json.loads(text)
    except Exception:
        return None


class DiscordRpcManager:
    """
    Manages the lifecycle of a connection to Discord's local RPC engine.
    """

    def __init__(self):
        self.lock = threading.Lock()
        self.sock: Optional[socket.socket] = None
        self.port: int = 6463
        self.nonce_counter: int = 0
        self.connected: bool = False
        self.authenticated: bool = False
        self.cached_voice_settings: Dict[str, Any] = {
            "mute": False,
            "deaf": False,
            "input_volume": 100,
            "output_volume": 100,
            "mode": "VOICE_ACTIVITY",
        }
        self.config: Dict[str, Any] = self.load_config()

    def load_config(self) -> Dict[str, Any]:
        if not os.path.exists(CONFIG_FILE):
            default_config = {
                "client_id": "",
                "client_secret": "",
                "access_token": "",
                "refresh_token": "",
                "rpc_enabled": True,
            }
            self.save_config(default_config)
            return default_config
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def save_config(self, cfg: Optional[Dict[str, Any]] = None) -> bool:
        if cfg is not None:
            self.config = cfg
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
            return True
        except Exception as e:
            print(f"[Discord RPC] Failed to save config: {e}")
            return False

    def is_discord_running(self) -> bool:
        """Checks if Discord's local RPC WebSocket port is currently open."""
        for p in range(6463, 6473):
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.3)
            try:
                s.connect(("127.0.0.1", p))
                s.close()
                self.port = p
                return True
            except Exception:
                s.close()
        return False

    def get_next_nonce(self) -> str:
        self.nonce_counter += 1
        return f"volctl_{self.nonce_counter}_{int(time.time())}"

    def disconnect(self):
        with self.lock:
            if self.sock:
                try:
                    self.sock.close()
                except Exception:
                    pass
            self.sock = None
            self.connected = False
            self.authenticated = False

    def connect(self, timeout: float = 2.0) -> bool:
        """Establishes the WebSocket connection with Discord's local RPC port."""
        with self.lock:
            if self.sock and self.connected:
                return True

            client_id = self.config.get("client_id") or "207646673902501888"  # StreamKit public client ID fallback
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(timeout)
                s.connect(("127.0.0.1", self.port))

                handshake = (
                    f"GET /?v=1&client_id={client_id} HTTP/1.1\r\n"
                    f"Host: 127.0.0.1:{self.port}\r\n"
                    "Upgrade: websocket\r\n"
                    "Connection: Upgrade\r\n"
                    "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
                    "Sec-WebSocket-Version: 13\r\n"
                    "Origin: https://streamkit.discord.com\r\n\r\n"
                ).encode("utf-8")
                s.sendall(handshake)

                # Read HTTP 101 Switching Protocols header
                http_resp = b""
                while b"\r\n\r\n" not in http_resp:
                    chunk = s.recv(512)
                    if not chunk:
                        s.close()
                        return False
                    http_resp += chunk

                if b"101 Switching Protocols" not in http_resp:
                    s.close()
                    return False

                # Read DISPATCH READY frame
                ready_frame = read_ws_frame(s)
                if not ready_frame or ready_frame.get("evt") != "READY":
                    s.close()
                    return False

                self.sock = s
                self.connected = True
                return True
            except Exception as e:
                # Discord not open or connection refused
                return False

    def send_rpc_command(self, cmd: str, args: Dict[str, Any], timeout: float = 3.0) -> Optional[Dict[str, Any]]:
        """Sends an RPC command and awaits its matched nonce response."""
        if not self.connected or not self.sock:
            if not self.connect():
                return None

        nonce = self.get_next_nonce()
        payload = json.dumps({"cmd": cmd, "args": args, "nonce": nonce})

        with self.lock:
            try:
                self.sock.settimeout(timeout)
                self.sock.sendall(build_ws_frame(payload))

                # Read frames until matching nonce arrives
                start = time.time()
                while time.time() - start < timeout:
                    frame = read_ws_frame(self.sock)
                    if not frame:
                        break
                    if frame.get("nonce") == nonce:
                        return frame
            except Exception as e:
                self.disconnect()
        return None

    def authenticate_with_token(self, token: str) -> bool:
        """Sends AUTHENTICATE command with an OAuth2 access token."""
        res = self.send_rpc_command("AUTHENTICATE", {"access_token": token})
        if res and res.get("cmd") == "AUTHENTICATE" and res.get("evt") is None:
            self.authenticated = True
            # Fetch initial voice settings immediately
            self.refresh_voice_settings()
            return True
        self.authenticated = False
        return False

    def ensure_authenticated(self) -> bool:
        """Ensures the connection is alive and authenticated."""
        if self.authenticated and self.sock and self.connected:
            return True

        if not self.connect():
            return False

        token = self.config.get("access_token", "")
        if token:
            if self.authenticate_with_token(token):
                return True
            # Token might be expired, attempt refresh if refresh_token available
            refresh_tok = self.config.get("refresh_token", "")
            if refresh_tok and self.refresh_oauth_token():
                token = self.config.get("access_token", "")
                if token and self.authenticate_with_token(token):
                    return True
        return False

    def request_authorization(self) -> Dict[str, Any]:
        """
        Triggers the Discord in-app authorization dialog for voice settings.
        Requires client_id and client_secret configured in discord_rpc.json.
        """
        client_id = self.config.get("client_id", "").strip()
        client_secret = self.config.get("client_secret", "").strip()

        if not client_id or not client_secret:
            return {
                "success": False,
                "error": "Client ID and Client Secret are required. Please configure them in Discord Settings.",
            }

        # Connect with user's client_id
        self.disconnect()
        self.config["client_id"] = client_id
        if not self.connect(timeout=3.0):
            return {
                "success": False,
                "error": "Cannot connect to Discord desktop. Please ensure Discord is open and running.",
            }

        # Send AUTHORIZE command
        res = self.send_rpc_command(
            "AUTHORIZE",
            {"client_id": client_id, "scopes": ["rpc", "rpc.voice.read", "rpc.voice.write"]},
            timeout=15.0,  # Wait for user click in Discord
        )

        if not res:
            return {"success": False, "error": "Authorization timed out or Discord was closed."}

        if res.get("evt") == "ERROR" or "code" not in res.get("data", {}):
            err_msg = res.get("data", {}).get("message", "Authorization rejected or canceled in Discord.")
            return {"success": False, "error": err_msg}

        code = res["data"]["code"]

        # Exchange authorization code for access_token with Discord OAuth2 API
        try:
            token_url = "https://discord.com/api/oauth2/token"
            data = urllib.parse.urlencode(
                {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": "https://localhost/",
                }
            ).encode("utf-8")

            req = urllib.request.Request(
                token_url,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "VolumeControlRPC/1.0",
                },
            )
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                token_data = json.loads(resp.read().decode("utf-8"))

            access_token = token_data.get("access_token", "")
            refresh_token = token_data.get("refresh_token", "")

            if not access_token:
                return {"success": False, "error": "Did not receive access_token from Discord OAuth2 API."}

            self.config["access_token"] = access_token
            self.config["refresh_token"] = refresh_token
            self.save_config()

            # Authenticate immediately
            auth_ok = self.authenticate_with_token(access_token)
            if auth_ok:
                return {
                    "success": True,
                    "message": "Successfully linked with Discord Native RPC!",
                    "voice_settings": self.cached_voice_settings,
                }
            else:
                return {"success": False, "error": "Received token but failed to authenticate on RPC socket."}

        except Exception as e:
            return {"success": False, "error": f"OAuth2 token exchange error: {str(e)}"}

    def refresh_oauth_token(self) -> bool:
        """Refreshes expired access_token using refresh_token."""
        client_id = self.config.get("client_id", "")
        client_secret = self.config.get("client_secret", "")
        refresh_token = self.config.get("refresh_token", "")

        if not client_id or not client_secret or not refresh_token:
            return False

        try:
            token_url = "https://discord.com/api/oauth2/token"
            data = urllib.parse.urlencode(
                {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                }
            ).encode("utf-8")

            req = urllib.request.Request(
                token_url,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "VolumeControlRPC/1.0",
                },
            )
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                token_data = json.loads(resp.read().decode("utf-8"))

            self.config["access_token"] = token_data.get("access_token", "")
            if "refresh_token" in token_data:
                self.config["refresh_token"] = token_data["refresh_token"]
            self.save_config()
            return True
        except Exception:
            return False

    def refresh_voice_settings(self) -> Dict[str, Any]:
        """Queries Discord via GET_VOICE_SETTINGS to read real-time mute and deaf states."""
        res = self.send_rpc_command("GET_VOICE_SETTINGS", {})
        if res and res.get("cmd") == "GET_VOICE_SETTINGS" and "data" in res:
            d = res["data"]
            self.cached_voice_settings = {
                "mute": d.get("mute", False),
                "deaf": d.get("deaf", False),
                "input_volume": int(d.get("input", {}).get("volume", 100)),
                "output_volume": int(d.get("output", {}).get("volume", 100)),
                "mode": d.get("mode", {}).get("type", "VOICE_ACTIVITY"),
            }
        return self.cached_voice_settings

    def set_voice_settings(
        self, mute: Optional[bool] = None, deaf: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """Updates Discord's voice settings natively via SET_VOICE_SETTINGS."""
        if not self.ensure_authenticated():
            return None

        args = {}
        if mute is not None:
            args["mute"] = bool(mute)
        if deaf is not None:
            args["deaf"] = bool(deaf)

        res = self.send_rpc_command("SET_VOICE_SETTINGS", args)
        if res and res.get("cmd") == "SET_VOICE_SETTINGS" and "data" in res:
            d = res["data"]
            self.cached_voice_settings = {
                "mute": d.get("mute", False),
                "deaf": d.get("deaf", False),
                "input_volume": int(d.get("input", {}).get("volume", 100)),
                "output_volume": int(d.get("output", {}).get("volume", 100)),
                "mode": d.get("mode", {}).get("type", "VOICE_ACTIVITY"),
            }
            return self.cached_voice_settings
        return None

    def toggle_mute(self) -> Dict[str, Any]:
        """Toggles Discord mute natively via RPC if authenticated, else returns None."""
        if self.ensure_authenticated():
            # Refresh current state to be sure
            self.refresh_voice_settings()
            new_mute = not self.cached_voice_settings.get("mute", False)
            res = self.set_voice_settings(mute=new_mute)
            if res is not None:
                return {
                    "success": True,
                    "mode": "rpc",
                    "action": "toggle_mute",
                    "muted": res["mute"],
                    "voice_settings": res,
                }
        return {"success": False, "mode": "fallback_hotkey"}

    def toggle_deafen(self) -> Dict[str, Any]:
        """Toggles Discord deafen natively via RPC if authenticated, else returns None."""
        if self.ensure_authenticated():
            self.refresh_voice_settings()
            new_deaf = not self.cached_voice_settings.get("deaf", False)
            res = self.set_voice_settings(deaf=new_deaf)
            if res is not None:
                return {
                    "success": True,
                    "mode": "rpc",
                    "action": "toggle_deafen",
                    "deafened": res["deaf"],
                    "voice_settings": res,
                }
        return {"success": False, "mode": "fallback_hotkey"}

    def get_status(self) -> Dict[str, Any]:
        """Returns the complete Discord integration status."""
        running = self.is_discord_running()
        is_auth = False
        if running:
            is_auth = self.ensure_authenticated()

        return {
            "running": running,
            "rpc_available": running,
            "authenticated": is_auth,
            "has_credentials": bool(
                self.config.get("client_id") and self.config.get("client_secret")
            ),
            "client_id": self.config.get("client_id", ""),
            "mode": "rpc" if is_auth else "hotkey",
            "voice_settings": self.cached_voice_settings,
        }


# Global Singleton Instance
rpc_manager = DiscordRpcManager()

