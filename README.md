# 🔊 Windows Web Volume Control

A self-hosted, touch-optimized web application to control Windows master audio and per-application volumes from any browser on your PC or mobile phone over local Wi-Fi.

---

## ✨ Features & Interactions

- **📱 Installable Progressive Web App (PWA):**
  - Install to your phone's Home Screen or PC desktop for a standalone, full-screen app experience without browser navigation bars.
  - Offline-first shell caching powered by a dedicated Service Worker (`sw.js`) and Web App Manifest (`manifest.json`).
  - High-resolution adaptive icons (192x192, 512x512, and SVG).
- **👆 Tap to Mute:** Big, satisfying tactile tiles for Master Volume and each running app. Tapping or clicking any tile instantly toggles Mute / Unmute.
- **↔️ Tile Growth & Horizontal Slide:** Press and hold any tile (or slide horizontally) — the tile smoothly **grows** into an active interactive slider with a glowing track and thumb. Slide **LEFT** to decrease volume and **RIGHT** to increase volume! A sleek HUD pill shows the live percentage and arrows.
- **🎨 Native App Icons:** High-resolution SVG icons for popular Windows applications (Spotify, Discord, Chrome, Steam, CS2 / Games, Firefox, Edge, VLC, NVIDIA, System Sounds).
- **⭐ Recent Apps Prioritized:** The most recently adjusted or active audio applications automatically float to the **first row** of the grid.
- **🎙️ Discord Voice Control:** When Discord is open, a dedicated Discord pill button appears in the header with an online indicator dot. Tapping it opens a modal to toggle Discord microphone mute (`Ctrl+Shift+M`) or deafen (`Ctrl+Shift+D`).
- **⚡ Custom PC Shortcuts & Layouts Deck:** Trigger PC commands, media keys, and window layouts directly from your phone. Includes a preset that opens 3 applications together and tiles them vertically across your 2nd screen (portrait monitor `1080x1920`). Add your own custom shortcuts via the built-in modal!
- **🤖 Voice-Controlled Local NLP Assistant:** Tap the primary microphone button in the header (or speak aloud) to trigger natural language commands locally without any cloud service:
  - *"Start recording in OBS Studio"* / *"Stop recording in OBS"*
  - *"Mute Discord"* / *"Toggle deafen"*
  - *"Stack 3 apps vertically on my 2nd screen"*
  - *"Set volume to 50%"* / *"Mute Spotify"* / *"Turn volume up"*
  - Audio voice feedback is read back via Web Speech Synthesis.
- **📷 Phone QR Connect:** Scan the on-screen QR code from your monitor to immediately control audio from your phone without typing anything.
- **🔒 100% Offline & Private:** Zero external CDNs or cloud dependencies. Runs entirely on your local machine and home router.

---

## 🚀 Quick Start

### 1. Launch the Server
Double-click **`run.bat`** (or execute from PowerShell):

```powershell
python server.py --host 0.0.0.0 --port 5000
```

### 2. Connect
* **On this PC:** Open [`http://localhost:5000`](http://localhost:5000)
* **On your Phone:** Make sure your phone is connected to the same Wi-Fi router, then open the displayed phone URL (e.g. `http://192.168.0.135:5000`) or scan the QR code from the PC monitor.

### 3. Install as PWA on Phone Chrome

Google Chrome restricts PWA installation on local Wi-Fi IP addresses (`http://192.168.x.x`) because it requires a secure origin. Choose either of these quick methods:

* **Method 1: Chrome 10-Second Flag (Recommended for standalone PWA with WebAPK):**
  1. Open a new tab in phone Chrome and go to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
  2. In the text box, paste your phone URL (e.g. `http://192.168.0.135:5000`).
  3. Select **Enabled** from the dropdown and tap **Relaunch**.
  4. Revisit your Volume Control page — tap the **Install** icon in the header or Chrome menu -> **"Install app"**!

* **Method 2: Run with HTTPS (SSL):**
  - Double-click **`run_ssl.bat`** (or `python server.py --ssl`).
  - Open `https://<YOUR-IP>:5000` on your phone, click Advanced &rarr; Proceed.

* **Method 3: Chrome Menu Shortcut:**
  - Tap Chrome's **⋮** (three dots) menu at top right &rarr; tap **"Add to Home screen"**.

* **iOS (Safari):**
  - Tap the Share icon (square with arrow pointing up) &rarr; tap **"Add to Home Screen"**.

---

## 🛠️ Project Structure

```text
volume_control/
├── AudioEngine.cs       # Native Windows WASAPI interop (C#)
├── AudioEngine.exe      # Compiled high-performance audio engine
├── audio_manager.py     # Python bridge & caching module
├── audio.py             # Compatibility alias
├── system_controller.py # Win32 monitor layout engine, hotkeys & process detector
├── shortcuts_manager.py # Custom shortcuts & macros manager
├── shortcuts.json       # Persistent shortcuts storage
├── nlp_agent.py         # 100% local Natural Language Processing agent
├── server.py            # FastAPI local server with PWA routes
├── build.bat            # Recompiles AudioEngine.cs
├── run.bat              # One-click startup script
├── requirements.txt     # Python packages
├── static/
│   ├── index.html       # Tactile glassmorphic web UI with gesture controls
│   ├── manifest.json    # PWA Web App Manifest
│   ├── sw.js            # PWA Service Worker for caching
│   ├── icon.svg         # Scalable vector app icon
│   ├── icon-192.png     # 192x192 PWA app icon
│   └── icon-512.png     # 512x512 PWA app icon
└── README.md            # Documentation
```
