@echo off
TITLE DINEDECK - Customer Application Launcher
COLOR 0A
cls

echo ========================================================
echo       DINEDECK CUSTOMER APPLICATION LAUNCHER
echo ========================================================
echo.
echo Launching Customer Web (:5173) and Android App (5554)...
echo Ensuring Backend API (:8080) is running...
echo.

cd /d "%~dp0"

REM Execute Customer App Launcher PowerShell Engine
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_customer.ps1"

echo.
echo ========================================================
echo DINEDECK Customer App is running!
echo You can run START_PARTNER_APP.bat and START_SUPERADMIN_APP.bat
echo at the same time to have all 3 apps active together.
echo ========================================================
pause
