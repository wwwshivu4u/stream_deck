@echo off
title Windows Web Volume Control (HTTPS)
cd /d "%~dp0"

echo ===================================================
echo   Starting Windows Web Volume Control (HTTPS)
echo ===================================================
echo.

python server.py --host 0.0.0.0 --port 5000 --ssl
if %errorlevel% neq 0 (
    echo.
    echo Server stopped or encountered an error.
    pause
)

