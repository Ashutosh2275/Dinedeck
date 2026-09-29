@echo off
TITLE DINEDECK Web Applications Launcher
COLOR 0B
cls

echo ========================================================
echo        DINEDECK THREE WEB APPS ONE-CLICK LAUNCHER
echo ========================================================
echo.

cd /d "%~dp0"

REM Execute DINEDECK Web Launcher PowerShell Engine
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_web.ps1"

echo.
echo ========================================================
echo DINEDECK Web Launcher execution finished.
echo Press any key to exit this status monitor window...
echo (Web servers will remain active in their own terminals)
echo ========================================================
pause >nul
