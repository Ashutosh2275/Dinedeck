# ==============================================================================
# DINEDECK - PARTNER OPERATIONS APP LAUNCHER (PowerShell Engine)
# Launches Partner Android App (emulator-5556) and Partner Web (:5174)
# Ensures Fastify Backend API (:8080) is active
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     DINEDECK - PARTNER OPERATIONS APPLICATION LAUNCHER" -ForegroundColor Cyan
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

# Discover Android SDK
$sdkCandidates = @(
    "D:\Android\Sdk",
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:ANDROID_HOME",
    "$env:ANDROID_SDK_ROOT",
    "C:\Android\Sdk"
)

$sdkDir = $null
foreach ($cand in $sdkCandidates) {
    if ($cand -and (Test-Path $cand) -and (Test-Path "$cand\platform-tools\adb.exe")) {
        $sdkDir = $cand
        break
    }
}

if (!$sdkDir) {
    Write-Host "[FATAL] Android SDK not found!" -ForegroundColor Red
    exit 1
}

$adbPath = "$sdkDir\platform-tools\adb.exe"
$emuPath = "$sdkDir\emulator\emulator.exe"
$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
if ($env:PATH -notlike "*$sdkDir\platform-tools*") {
    $env:PATH = "$sdkDir\platform-tools;$sdkDir\emulator;$env:PATH"
}

function Test-PortListening {
    param ([int]$Port)
    try {
        $tcp = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($tcp) { return $true }
    } catch {}
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $success = $iar.AsyncWaitHandle.WaitOne(300)
        if ($success -and $client.Connected) {
            $client.EndConnect($iar)
            $client.Close()
            return $true
        }
        $client.Close()
    } catch {}
    return $false
}

function Wait-For-Device-Boot {
    param ([string]$DeviceId, [int]$TimeoutSec = 90)
    Write-Host "  -> Waiting for $DeviceId boot completion..." -ForegroundColor DarkYellow -NoNewline
    $start = Get-Date
    while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSec) {
        try {
            $res = & $adbPath -s $DeviceId shell getprop sys.boot_completed 2>$null
            if ($res -and $res.Trim() -eq "1") {
                Write-Host " [BOOTED 100%]" -ForegroundColor Green
                return $true
            }
        } catch {}
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    Write-Host " [TIMEOUT]" -ForegroundColor Red
    return $false
}

# 1. Start Backend API (:8080) if not running
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 1: Backend API Service Verification (:8080)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$backendDir = Join-Path $rootDir "backend"
$isBackendRunning = Test-PortListening -Port 8080

if ($isBackendRunning) {
    Write-Host "[ONLINE] Fastify Backend API is already running on port 8080." -ForegroundColor Green
} else {
    Write-Host "[START] Launching Fastify Backend API..." -ForegroundColor Yellow
    if (Test-Path $backendDir) {
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "start `"DINEDECK BACKEND API`" /d `"$backendDir`" cmd /k `"npm run dev`"")
        Start-Sleep -Seconds 3
        Write-Host "[ONLINE] Backend API window started." -ForegroundColor Green
    }
}
Write-Host ""

# 2. Start Partner Web (:5174) if not running
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 2: Partner Web Service (:5174)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$partnerWebDir = Join-Path $rootDir "partner-web"
$isPartnerWebRunning = Test-PortListening -Port 5174

if ($isPartnerWebRunning) {
    Write-Host "[ONLINE] Partner Web is already running on http://localhost:5174" -ForegroundColor Green
} else {
    Write-Host "[START] Launching Partner Web on port 5174..." -ForegroundColor Yellow
    if (Test-Path $partnerWebDir) {
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "start `"DINEDECK PARTNER WEB`" /d `"$partnerWebDir`" cmd /k `"npm run dev`"")
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:5174"
        Write-Host "[ONLINE] Partner Web launched in browser." -ForegroundColor Green
    }
}
Write-Host ""

# 3. Start Partner Android App (emulator-5556 / AVD: Partner)
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 3: Partner Mobile Android App (Port 5556)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$apkPath = Join-Path $rootDir "partner-app\build\outputs\apk\debug\partner-app-debug.apk"
$devId = "emulator-5556"
$avdName = "Partner"
$activity = "com.dinedeck.partner/.PartnerMainActivity"

if (!(Test-Path $apkPath)) {
    Write-Host "[BUILD] Building Partner APK via gradlew :partner-app:assembleDebug..." -ForegroundColor Cyan
    Push-Location $rootDir
    & ".\gradlew.bat" :partner-app:assembleDebug
    Pop-Location
}

$activeDevices = @()
try {
    $adbOut = & $adbPath devices
    foreach ($line in ($adbOut -split "`r?`n")) {
        if ($line -match '^(emulator-\d+)\s+device') {
            $activeDevices += $matches[1]
        }
    }
} catch {}

if ($activeDevices -contains $devId) {
    Write-Host "[REUSE] Partner Emulator is already active on $devId." -ForegroundColor Green
} else {
    Write-Host "[LAUNCH] Starting Partner Android Emulator (AVD: $avdName on Port 5556)..." -ForegroundColor Cyan
    Start-Process -FilePath $emuPath -ArgumentList @("-avd", $avdName, "-port", "5556", "-no-snapshot-load", "-no-audio")
}

$booted = Wait-For-Device-Boot -DeviceId $devId -TimeoutSec 90
if ($booted) {
    Write-Host "  -> Installing Partner APK..." -ForegroundColor DarkGray -NoNewline
    & $adbPath -s $devId install -r $apkPath | Out-Null
    Write-Host " [INSTALLED]" -ForegroundColor Green

    Write-Host "  -> Launching Partner App..." -ForegroundColor DarkGray -NoNewline
    & $adbPath -s $devId shell am start -n $activity | Out-Null
    Write-Host " [ACTIVE]" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       DINEDECK PARTNER APPLICATION IS READY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Backend API       : http://localhost:8080 [ONLINE]" -ForegroundColor Green
Write-Host "Partner Web       : http://localhost:5174 [ONLINE]" -ForegroundColor Green
Write-Host "Partner Android   : emulator-5556 [ACTIVE]" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
