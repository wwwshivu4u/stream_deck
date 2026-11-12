@echo off
setlocal
echo ========================================================
echo   Compiling AudioEngine.exe (Windows WASAPI Engine)
echo ========================================================

set CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

if not exist "%CSC_PATH%" (
    set CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

if not exist "%CSC_PATH%" (
    echo [ERROR] csc.exe not found.
    pause
    exit /b 1
)

echo Using compiler: %CSC_PATH%
"%CSC_PATH%" /optimize /target:exe /out:"%~dp0AudioEngine.exe" "%~dp0AudioEngine.cs"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] AudioEngine.exe compiled successfully!
) else (
    echo [FAILED] Compilation failed.
)

endlocal

