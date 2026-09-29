@echo off
TITLE DINEDECK - Partner Operations Application Launcher
COLOR 0B
cls

echo ========================================================
echo     DINEDECK PARTNER OPERATIONS APPLICATION LAUNCHER
echo ========================================================
echo.
echo Launching Partner Web (:5174) and Android App (5556)...
echo Ensuring Backend API (:8080) is running...
echo.

cd /d "%~dp0"

REM Execute Partner App Launcher PowerShell Engine
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_partner.ps1"

echo.
echo ========================================================
echo DINEDECK Partner App is running!
echo You can run START_CUSTOMER_APP.bat and START_SUPERADMIN_APP.bat
echo at the same time to have all 3 apps active together.
echo ========================================================
pause
