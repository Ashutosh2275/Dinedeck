@echo off
TITLE DINEDECK - Service Shutdown
COLOR 0C
cls

echo ========================================================
echo         DINEDECK GRACEFUL SERVICE TERMINATION
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev-stop.ps1"

timeout /t 3 >nul
