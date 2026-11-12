import argparse
import json
import os
import socket
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

import audio_manager
import nlp_agent
import shortcuts_manager
import system_controller

app = FastAPI(title="Windows Web Volume Control")

# Enable CORS for local devices & browsers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
PORT = 5000


def get_local_ip() -> str:
    """Finds the local IPv4 address on your home Wi-Fi/router."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


class MasterRequest(BaseModel):
    volume: Optional[int] = None
    muted: Optional[bool] = None


class AppRequest(BaseModel):
    pid: int
    volume: Optional[int] = None
    muted: Optional[bool] = None


class NlpRequest(BaseModel):
    text: str


class WindowStackRequest(BaseModel):
    monitor: int = 2
    layout: str = "vertical"
    apps: Optional[List[Dict[str, str]]] = None


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Error] {request.method} {request.url}: {exc}")
    return JSONResponse(status_code=200, content=audio_manager.get_audio_state())


@app.get("/")
def index():
    path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(path):
        return FileResponse(path)
    return {"message": "index.html not found"}


@app.get("/manifest.json")
def get_manifest():
    path = os.path.join(STATIC_DIR, "manifest.json")
    if os.path.exists(path):
        return FileResponse(path, media_type="application/manifest+json")
    return JSONResponse(status_code=404, content={"message": "manifest.json not found"})


@app.get("/sw.js")
def get_sw():
    path = os.path.join(STATIC_DIR, "sw.js")
    if os.path.exists(path):
        return FileResponse(
            path,
            media_type="application/javascript",
            headers={"Service-Worker-Allowed": "/", "Cache-Control": "no-cache, no-store, must-revalidate"},
        )
    return JSONResponse(status_code=404, content={"message": "sw.js not found"})


@app.get("/favicon.ico")
def get_favicon():
    path = os.path.join(STATIC_DIR, "icon-192.png")
    if os.path.exists(path):
        return FileResponse(path, media_type="image/png")
    return JSONResponse(status_code=404, content={"message": "favicon not found"})


if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def ensure_ssl_certs(local_ip: str) -> tuple:
    """Generates self-signed SSL certs with SAN for local IP and localhost if they do not exist."""
    import datetime
    import ipaddress
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    cert_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "certs")
    os.makedirs(cert_dir, exist_ok=True)
    key_path = os.path.join(cert_dir, "key.pem")
    cert_path = os.path.join(cert_dir, "cert.pem")

    if os.path.exists(key_path) and os.path.exists(cert_path):
        return cert_path, key_path

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "VolumeControl")])
    san = [
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
    ]
    try:
        san.append(x509.IPAddress(ipaddress.IPv4Address(local_ip)))
    except Exception:
        pass

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365))
        .add_extension(x509.SubjectAlternativeName(san), critical=False)
        .sign(key, hashes.SHA256())
    )

    with open(key_path, "wb") as f:
        f.write(
            key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    return cert_path, key_path


@app.get("/api/info")
def get_info(request: Request):
    ip = get_local_ip()
    scheme = request.url.scheme
    return {
        "ip": ip,
        "port": PORT,
        "phone_url": f"{scheme}://{ip}:{PORT}",
        "local_url": f"{scheme}://localhost:{PORT}",
        "is_https": scheme == "https",
    }


@app.get("/api/status")
@app.get("/status")
def get_status():
    state = audio_manager.get_audio_state()
    state["obs_running"] = system_controller.is_obs_running()
    return state


# Shortcuts & Macros Endpoints
@app.get("/api/shortcuts")
def list_shortcuts():
    return shortcuts_manager.load_shortcuts()


@app.get("/api/shortcuts/suggestions")
def list_suggested_shortcuts():
    return shortcuts_manager.get_suggested_shortcuts()


@app.post("/api/shortcuts/reorder")
async def reorder_shortcuts_endpoint(request: Request):
    try:
        data = await request.json()
        order = data.get("order") if isinstance(data, dict) else data
        if isinstance(order, list):
            updated = shortcuts_manager.reorder_shortcuts(order)
            return {"success": True, "shortcuts": updated}
        return {"success": False, "error": "Order must be an array of IDs"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/shortcuts/save_all")
async def save_all_shortcuts_endpoint(request: Request):
    try:
        data = await request.json()
        shortcuts = data.get("shortcuts") if isinstance(data, dict) else data
        if isinstance(shortcuts, list):
            shortcuts_manager.save_all_shortcuts(shortcuts)
            return {"success": True, "shortcuts": shortcuts}
        return {"success": False, "error": "Shortcuts must be an array"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/shortcuts/run/{shortcut_id}")
def run_shortcut_endpoint(shortcut_id: str):
    return shortcuts_manager.run_shortcut(shortcut_id)


@app.post("/api/shortcuts/save")
async def save_shortcut_endpoint(request: Request):
    try:
        data = await request.json()
        return shortcuts_manager.create_or_update_shortcut(data)
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/shortcuts/{shortcut_id}")
def delete_shortcut_endpoint(shortcut_id: str):
    success = shortcuts_manager.delete_shortcut(shortcut_id)
    return {"success": success}


# Windows & Monitors Endpoints
@app.get("/api/windows/monitors")
def list_monitors():
    return system_controller.get_monitors()


@app.post("/api/windows/stack")
def stack_windows_endpoint(req: WindowStackRequest):
    default_apps = [
        {"name": "Notepad", "cmd": "notepad.exe", "match": "notepad"},
        {"name": "Calculator", "cmd": "calc.exe", "match": "calculator"},
        {"name": "Command Prompt", "cmd": "cmd.exe", "match": "cmd"},
    ]
    apps = req.apps or default_apps
    return system_controller.launch_and_stack_apps(apps, monitor_index=req.monitor, layout=req.layout)


# OBS Studio Endpoints
@app.post("/api/obs/record")
def obs_record_endpoint():
    return system_controller.trigger_obs_record()


# Local NLP Agent Endpoint
@app.post("/api/nlp/execute")
def nlp_execute_endpoint(req: NlpRequest):
    res = nlp_agent.execute_nlp_command(req.text)
    res["audio_state"] = audio_manager.get_audio_state()
    return res


@app.post("/api/master")
def update_master(req: MasterRequest):
    if req.volume is not None:
        audio_manager.set_master_volume(req.volume)
    if req.muted is not None:
        audio_manager.set_master_mute(req.muted)
    return audio_manager.get_audio_state()


@app.post("/api/app")
def update_app(req: AppRequest):
    if req.volume is not None:
        audio_manager.set_app_volume(req.pid, req.volume)
    if req.muted is not None:
        audio_manager.set_app_mute(req.pid, req.muted)
    return audio_manager.get_audio_state()


@app.post("/")
@app.post("/api")
@app.post("/volume")
async def root_post(request: Request):
    """Universal handler for generic POST commands."""
    try:
        body = await request.json()
    except Exception:
        try:
            raw = (await request.body()).decode("utf-8", errors="ignore")
            body = json.loads(raw) if raw.startswith("{") else {}
        except Exception:
            body = {}

    if not isinstance(body, dict):
        body = {}

    # Master updates
    if "volume" in body and "pid" not in body:
        try:
            audio_manager.set_master_volume(int(float(body["volume"])))
        except (ValueError, TypeError):
            pass

    if "muted" in body and "pid" not in body:
        m = body["muted"]
        audio_manager.set_master_mute(m if isinstance(m, bool) else (str(m).lower() in ("true", "1")))
    elif "mute" in body and "pid" not in body:
        m = body["mute"]
        audio_manager.set_master_mute(m if isinstance(m, bool) else (str(m).lower() in ("true", "1")))

    # Application updates
    if "pid" in body:
        try:
            pid = int(body["pid"])
            if "volume" in body:
                audio_manager.set_app_volume(pid, int(float(body["volume"])))
            if "muted" in body:
                m = body["muted"]
                audio_manager.set_app_mute(pid, m if isinstance(m, bool) else (str(m).lower() in ("true", "1")))
            elif "mute" in body:
                m = body["mute"]
                audio_manager.set_app_mute(pid, m if isinstance(m, bool) else (str(m).lower() in ("true", "1")))
        except (ValueError, TypeError):
            pass

    return audio_manager.get_audio_state()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json(audio_manager.get_audio_state())
    try:
        while True:
            text = await websocket.receive_text()
            try:
                data = json.loads(text)
                if isinstance(data, dict):
                    if "volume" in data and "pid" not in data:
                        audio_manager.set_master_volume(int(data["volume"]))
                    if "muted" in data and "pid" not in data:
                        audio_manager.set_master_mute(bool(data["muted"]))
                    if "pid" in data:
                        pid = int(data["pid"])
                        if "volume" in data:
                            audio_manager.set_app_volume(pid, int(data["volume"]))
                        if "muted" in data:
                            audio_manager.set_app_mute(pid, bool(data["muted"]))
            except Exception:
                pass
            await websocket.send_json(audio_manager.get_audio_state())
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Windows Web Volume Control")
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--ssl", action="store_true", help="Enable HTTPS (self-signed SSL for PWA)")
    args = parser.parse_args()

    PORT = args.port
    local_ip = get_local_ip()
    protocol = "https" if args.ssl else "http"

    print("\n" + "=" * 60)
    print("      🔊 Windows Web Volume Control Server")
    print("=" * 60)
    print(f"  [+] Local PC:      {protocol}://localhost:{PORT}")
    print(f"  [+] Phone / Wi-Fi: {protocol}://{local_ip}:{PORT}")
    print("=" * 60)
    if args.ssl:
        print("  * HTTPS Mode: Using local SSL certificate.")
    else:
        print("  * HTTP Mode: For phone PWA installation, see README.md")
    print("  * Press Ctrl+C to stop.")
    print("=" * 60 + "\n")

    if args.ssl:
        cert_file, key_file = ensure_ssl_certs(local_ip)
        uvicorn.run(
            app,
            host=args.host,
            port=PORT,
            ssl_keyfile=key_file,
            ssl_certfile=cert_file,
            log_level="info",
        )
    else:
        uvicorn.run(app, host=args.host, port=PORT, log_level="info")
