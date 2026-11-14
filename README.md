# 🔊 Windows Web Volume Control & Cockpit HUD

A self-hosted, touch-optimized web application to control Windows master audio, individual application volumes, shortcuts, hardware telemetry, and open network sockets from any browser on your PC or mobile phone over local Wi-Fi.

---

## ✨ Features & Interactions

- **📱 Installable Progressive Web App (PWA):**
  - Install to your phone's Home Screen or PC desktop for a standalone, full-screen app experience without browser navigation bars.
  - Offline-first shell caching powered by a dedicated Service Worker (`sw.js`) and Web App Manifest (`manifest.json`).
  - High-resolution adaptive icons (192x192, 512x512, and SVG).
- **👆 Tap to Mute & Tactile Gestures:**
  - Big, satisfying tactile tiles for Master Volume and each running app. Tapping or clicking any tile instantly toggles Mute / Unmute.
  - Press and hold any tile (or slide horizontally) — the tile smoothly grows into an active slider with a glowing track. Slide **LEFT** to decrease and **RIGHT** to increase!
  - Touch-optimized without sticky hover states on mobile/touchscreens.
- **🔌 Active Ports & Socket Security Cockpit:**
  - Real-time listening port scanner displaying local interfaces, PID, protocol, and full executable paths.
  - **Security Triage Engine:** Automatically flags ports as:
    - `🚨 SUSPICIOUS / HIGH RISK`: Trojan listeners, backdoor targets, executables running from `Temp`/`Downloads`, or databases (`Redis`, `MongoDB`) exposed on `0.0.0.0`.
    - `⚠️ LAN EXPOSED`: Dev servers listening on `0.0.0.0` accessible across the local network.
    - `🟢 SAFE LOCALHOST`: Developer sockets safely isolated to `127.0.0.1` loopback.
    - `🛡️ SYSTEM`: Core protected Windows kernel sockets (`PID <= 4`, `svchost.exe`).
  - One-click port killer to terminate hung servers (with protected system process safeguards).
- **🌙 Dim-Lit OLED Standby HUD:**
  - Fullscreen battery-saver HUD with real hardware telemetry (CPU, GPU, RAM, Network sparklines, Power, Uptime).
  - Strict `dvh` zero-scroll layout with subtle OLED anti-burn-in drift.
  - Dual-layer wake guard (600ms debounce delay) preventing accidental click-throughs or double-clicks on home screen buttons upon waking.
- **🚀 Windows App Launcher:**
  - Automatically indexes Windows Start Menu apps and common tools for instant remote launching.
- **📝 Granular Brain Dump & Notes:**
  - Local task, bug, and idea scratchpad with categorization, priority levels, and Markdown export.
- **🐾 Dynamic Roaming Pixel Mascot ("Byte"):**
  - Interactive companion that roams your cockpit, reacts to volume adjustments, sleeps during standby, and levels up with XP.
- **⚡ Custom PC Shortcuts & Layouts Deck:**
  - Trigger PC commands, media keys, and window layouts directly from your phone.
- **🤖 100% Offline Voice NLP Assistant:**
  - Hands-free natural language voice commands via local rule engine or local Ollama AI.
- **🔒 100% Offline & Private:**
  - Zero external CDNs or cloud trackers. Runs entirely on your local machine and local home router.

---

## 🔒 Security & Privacy Notice

- **Home Wi-Fi Usage (Default):** Running with `--host 0.0.0.0` allows your phone, tablet, and PC to communicate over your local private Wi-Fi network.
- **Public Wi-Fi (Coffee Shops, Airports, Shared Networks):** Because the local dashboard does not require a password, anyone on the same unsegmented network could potentially access the web interface. When on public Wi-Fi, run the server with loopback isolation:
  ```powershell
  python server.py --host 127.0.0.1 --port 5000
  ```
- **Local Certificates & Data:** Runtime SSL certificates (`certs/`) and personal notes (`notes.json`) are excluded from version control via `.gitignore`.
- **System Safety Safeguard:** Process termination endpoints refuse to terminate core Windows kernel processes (`PID <= 4`, `csrss.exe`, `lsass.exe`, `services.exe`) to prevent accidental system instability.

---

## 🚀 Quick Start

### 1. Requirements & Setup
Ensure you have Python 3.10+ installed on Windows. Install dependencies:

```powershell
pip install -r requirements.txt
```

### 2. Launch the Server
Double-click **`run.bat`** (or execute from PowerShell):

```powershell
python server.py --host 0.0.0.0 --port 5000
```

For secure HTTPS (recommended for mobile PWA camera/audio permissions):
```powershell
python server.py --host 0.0.0.0 --port 5000 --ssl
```

### 3. Connect
* **On this PC:** Open [`http://localhost:5000`](http://localhost:5000)
* **On your Phone:** Ensure your phone is connected to the same Wi-Fi router, then open the displayed phone URL (e.g. `http://192.168.0.x:5000`) or scan the QR code from the PC monitor.

---

## 🛠️ Project Structure

```text
volume_control/
├── AudioEngine.cs       # Native Windows WASAPI interop (C#)
├── AudioEngine.exe      # Compiled high-performance audio engine
├── audio_manager.py     # Python bridge & volume cache module
├── audio.py             # Compatibility alias
├── system_controller.py # Hardware monitor, Win32 window manager & port security audit
├── shortcuts_manager.py # Custom shortcuts & macros manager
├── shortcuts.json       # Persistent default shortcuts storage
├── app_launcher.py      # Windows App Launcher & Start Menu scanner
├── notes_manager.py     # Granular brain dump notes engine
├── nlp_agent.py         # 100% local Natural Language Processing agent
├── server.py            # FastAPI local server with PWA routes & security breakdown
├── build.bat            # Recompiles AudioEngine.cs via .NET csc.exe
├── run.bat              # One-click startup script (HTTP)
├── run_ssl.bat          # One-click startup script (HTTPS)
├── requirements.txt     # Python dependencies
├── static/
│   ├── index.html       # Cockpit HUD, Standby mode, gesture sliders & ports triage UI
│   ├── manifest.json    # PWA Web App Manifest
│   ├── sw.js            # PWA Service Worker for offline shell caching
│   ├── icon.svg         # Scalable vector app icon
│   ├── icon-192.png     # 192x192 PWA app icon
│   └── icon-512.png     # 512x512 PWA app icon
└── README.md            # Documentation
```
