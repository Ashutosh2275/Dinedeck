@echo off
TITLE DINEDECK - Master Development Stack Launcher
COLOR 0B
cls

echo ========================================================
echo         DINEDECK FULL PLATFORM DEV LAUNCHER
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev-start.ps1"

pause
