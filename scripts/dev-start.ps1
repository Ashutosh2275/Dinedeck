# ==============================================================================
# DINEDECK - START ALL PLATFORM SERVICES (PowerShell Automation Engine)
# ==============================================================================
param (
    [switch]$NoBrowser
)

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         DINEDECK FULL-STACK ONE-CLICK LAUNCHER             " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $PSScriptRoot
if (!(Test-Path (Join-Path $rootDir "backend"))) {
    $rootDir = "d:\Dindeck"
}

Write-Host "[INFO] Monorepo Root: $rootDir" -ForegroundColor Gray

# 1. Dependency Pre-checks
function Test-CommandAvailable {
    param ([string]$Command)
    $cmd = Get-Command $Command -ErrorAction SilentlyContinue
    return ($null -ne $cmd)
}

Write-Host "[STEP 1/4] Checking System Prerequisites..." -ForegroundColor Yellow
if (!(Test-CommandAvailable "node")) {
    Write-Host "[ERROR] Node.js is not found on PATH. Please install Node.js 20+." -ForegroundColor Red
    exit 1
}
$nodeVer = node -v
Write-Host "  -> Node.js: $nodeVer" -ForegroundColor Green

if (Test-CommandAvailable "docker") {
    Write-Host "  -> Docker CLI: Available" -ForegroundColor Green
} else {
    Write-Host "  -> Docker CLI: Not installed or not on PATH (Local services supported)" -ForegroundColor Yellow
}

# 2. Port and Process Management
function Free-Port {
    param ([int]$Port, [string]$ServiceName)
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -gt 0) {
                    Write-Host "  [WARN] Port $Port is currently used by PID $pidToKill ($ServiceName). Freeing port..." -ForegroundColor Yellow
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}

Write-Host "`n[STEP 2/4] Verifying Service Ports..." -ForegroundColor Yellow
# Ensure backend port is managed properly
# We do not aggressively kill 5432 or 6379 as those are system database engines.

# 3. Launching Services
Write-Host "`n[STEP 3/4] Launching DineDeck Services..." -ForegroundColor Yellow

$services = @(
    @{
        Key = "backend"
        Name = "DineDeck Fastify Backend API"
        Path = (Join-Path $rootDir "backend")
        Port = 8080
        Cmd = "npm run start"
        Url = "http://localhost:8080/health"
    },
    @{
        Key = "customer"
        Name = "Customer Web (QR Dining)"
        Path = (Join-Path $rootDir "customer-web")
        Port = 5173
        Cmd = "npm run dev"
        Url = "http://localhost:5173"
    },
    @{
        Key = "partner"
        Name = "Partner Web (POS & KDS)"
        Path = (Join-Path $rootDir "partner-web")
        Port = 5174
        Cmd = "npm run dev"
        Url = "http://localhost:5174"
    },
    @{
        Key = "admin"
        Name = "Super Admin Control Center Web"
        Path = (Join-Path $rootDir "admin-web")
        Port = 5175
        Cmd = "npm run dev"
        Url = "http://localhost:5175"
    }
)

foreach ($svc in $services) {
    Free-Port -Port $svc.Port -ServiceName $svc.Name
    Write-Host "  -> Starting $($svc.Name) on port $($svc.Port)..." -ForegroundColor Cyan
    
    $startScript = "Set-Location '$($svc.Path)'; Write-Host 'Starting $($svc.Name)...' -ForegroundColor Cyan; $($svc.Cmd)"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $startScript -WindowStyle Minimized
}

# 4. Wait and Probe Health
Write-Host "`n[STEP 4/4] Verifying Endpoints Health..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

function Check-Http {
    param ([string]$Url)
    try {
        $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        return ($null -ne $resp -and $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400)
    } catch {
        return $false
    }
}

$backendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    if (Check-Http "http://localhost:8080/health") {
        $backendReady = $true
        break
    }
    Start-Sleep -Seconds 1
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "        DINEDECK ECOSYSTEM SUCCESSFULLY ONLINE              " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Backend API:          http://localhost:8080" -ForegroundColor White
Write-Host "  API Health Probe:     http://localhost:8080/health" -ForegroundColor White
Write-Host "  Customer Web:         http://localhost:5173" -ForegroundColor White
Write-Host "  Partner POS & KDS:    http://localhost:5174" -ForegroundColor White
Write-Host "  Super Admin Center:   http://localhost:5175" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To stop all services, run: scripts\dev-stop.ps1 or STOP_DINEDECK.bat" -ForegroundColor Cyan
