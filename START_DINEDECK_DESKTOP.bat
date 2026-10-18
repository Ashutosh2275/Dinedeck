@echo off
TITLE DINEDECK Windows Commercial Desktop Launcher
COLOR 0B
cls

echo ========================================================
echo     DINEDECK WINDOWS COMMERCIAL DESKTOP LAUNCHER
echo ========================================================
echo.
echo Launching DineDeck Partner POS & KDS + Control Center...
echo Ensuring Backend API (:8080) is running...
echo.

cd /d "%~dp0"

REM Execute DineDeck Desktop Launcher PowerShell Engine
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_desktop.ps1"

echo.
echo ========================================================
echo DINEDECK Windows Desktop applications are active!
echo ========================================================
pause
