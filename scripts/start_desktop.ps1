# ==============================================================================
# DINEDECK - WINDOWS DESKTOP APPLICATIONS LAUNCHER (PowerShell Engine)
# Launches Partner POS & KDS and Super Admin Control Center Desktop Apps
# Ensures Backend API (:8080) is active
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     DINEDECK - WINDOWS COMMERCIAL DESKTOP SUITE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$PSScriptRootDirectory = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($PSScriptRootDirectory)) {
    $rootDir = "D:\Dindeck"
} else {
    $rootDir = $PSScriptRootDirectory
}

if (!(Test-Path $rootDir)) {
    if (Test-Path "D:\Dindeck") { $rootDir = "D:\Dindeck" }
    elseif (Test-Path "D:\DINEDECK") { $rootDir = "D:\DINEDECK" }
}

Write-Host "[WORKSPACE] Root directory: $rootDir" -ForegroundColor Gray

function Test-PortListening {
    param ([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $conn)
    } catch {
        return $false
    }
}

# 1. Check & Ensure Backend is active on 8080
Write-Host "[1/3] Verifying DineDeck Backend Engine (:8080)..." -ForegroundColor Yellow
$backendActive = Test-PortListening -Port 8080

if (!$backendActive) {
    Write-Host "  -> Backend not running. Starting Fastify server..." -ForegroundColor DarkYellow
    $backendDir = Join-Path $rootDir "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run start" -WindowStyle Minimized
    $retries = 20
    while ($retries -gt 0 -and !(Test-PortListening -Port 8080)) {
        Start-Sleep -Seconds 1
        $retries--
    }
    if (Test-PortListening -Port 8080) {
        Write-Host "  -> Backend is healthy and ready on port 8080." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Backend is taking time to start, proceeding anyway..." -ForegroundColor Yellow
    }
} else {
    Write-Host "  -> Backend is already active on port 8080." -ForegroundColor Green
}

# 2. Launch DineDeck Partner POS & KDS
Write-Host "[2/3] Launching DineDeck Partner POS & KDS..." -ForegroundColor Yellow
$partnerExeInstalled = "C:\DineDeckPartner\DineDeck Partner POS & KDS.exe"
if (Test-Path $partnerExeInstalled) {
    Write-Host "  -> Launching installed application from $partnerExeInstalled" -ForegroundColor Green
    Start-Process -FilePath $partnerExeInstalled
} else {
    Write-Host "  -> Launching from project workspace (desktop-partner)..." -ForegroundColor Cyan
    $partnerDesktopDir = Join-Path $rootDir "desktop-partner"
    Start-Process -FilePath "npx" -ArgumentList "electron ." -WorkingDirectory $partnerDesktopDir
}

# 3. Launch DineDeck Super Admin Control Center
Write-Host "[3/3] Launching DineDeck Control Center (Super Admin)..." -ForegroundColor Yellow
$adminExeInstalled = "C:\DineDeckAdmin\DineDeck Control Center.exe"
if (Test-Path $adminExeInstalled) {
    Write-Host "  -> Launching installed application from $adminExeInstalled" -ForegroundColor Green
    Start-Process -FilePath $adminExeInstalled
} else {
    Write-Host "  -> Launching from project workspace (desktop-admin)..." -ForegroundColor Cyan
    $adminDesktopDir = Join-Path $rootDir "desktop-admin"
    Start-Process -FilePath "npx" -ArgumentList "electron ." -WorkingDirectory $adminDesktopDir
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DineDeck Windows Applications Launched Successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
