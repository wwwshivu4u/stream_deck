@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   Windows Web Volume Control
echo ========================================================

:: Check if AudioEngine.exe exists, compile if missing
if not exist "%~dp0AudioEngine.exe" (
    echo [*] AudioEngine.exe not found. Building now...
    call "%~dp0build.bat"
    if not exist "%~dp0AudioEngine.exe" (
        echo [!] Failed to compile AudioEngine.exe. Exiting.
        pause
        exit /b 1
    )
)

:: Run the server (listening on 0.0.0.0 so phone on same Wi-Fi can connect)
python server.py --host 0.0.0.0 --port 5000

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Server exited with an error.
    pause
)

endlocal

