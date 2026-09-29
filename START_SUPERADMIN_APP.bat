@echo off
TITLE DINEDECK - Superadmin Control Center Application Launcher
COLOR 0D
cls

echo ========================================================
echo   DINEDECK SUPERADMIN CONTROL CENTER APPLICATION LAUNCHER
echo ========================================================
echo.
echo Launching Superadmin Web (:5175) and Android App (5558)...
echo Ensuring Backend API (:8080) is running...
echo.

cd /d "%~dp0"

REM Execute Superadmin App Launcher PowerShell Engine
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_superadmin.ps1"

echo.
echo ========================================================
echo DINEDECK Superadmin App is running!
echo You can run START_CUSTOMER_APP.bat and START_PARTNER_APP.bat
echo at the same time to have all 3 apps active together.
echo ========================================================
pause
