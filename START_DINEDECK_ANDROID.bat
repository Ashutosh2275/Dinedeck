@echo off
TITLE DINEDECK Three Android Mobile Apps Launcher
COLOR 0E
cls

echo ========================================================
echo       DINEDECK THREE ANDROID APPS ONE-CLICK LAUNCHER
echo ========================================================
echo.

cd /d "%~dp0"

REM Execute DINEDECK Android Launcher PowerShell Engine
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_android.ps1"

echo.
echo ========================================================
echo DINEDECK Android Launcher execution finished.
echo Press any key to exit this status monitor window...
echo (Emulators and apps will remain active on your screen)
echo ========================================================
pause >nul
