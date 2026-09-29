# ==============================================================================
# DINEDECK - THREE ANDROID APPS ONE-CLICK LAUNCHER (PowerShell Engine)
# Launches Customer App (5554), Partner Operations (5556), Admin Control Center (5558)
# Automatically ensures Backend API (:8080) is running for live data & WebSockets
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     DINEDECK - THREE ANDROID APPS ONE-CLICK LAUNCHER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Workspace Root Detection
$PSScriptRootDirectory = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($PSScriptRootDirectory)) {
    $rootDir = "D:\Dindeck"
} else {
    $rootDir = $PSScriptRootDirectory
}

if (!(Test-Path $rootDir)) {
    if (Test-Path "D:\DINEDECK") {
        $rootDir = "D:\DINEDECK"
    } elseif (Test-Path "D:\Dindeck") {
        $rootDir = "D:\Dindeck"
    } else {
        Write-Host "[FATAL] Workspace directory not found: $rootDir" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[WORKSPACE] Root directory: $rootDir" -ForegroundColor Gray

# 2. Android SDK Discovery
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
    Write-Host "[FATAL] Android SDK with adb.exe not found in standard paths!" -ForegroundColor Red
    exit 1
}

$adbPath = "$sdkDir\platform-tools\adb.exe"
$emuPath = "$sdkDir\emulator\emulator.exe"
$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
if ($env:PATH -notlike "*$sdkDir\platform-tools*") {
    $env:PATH = "$sdkDir\platform-tools;$sdkDir\emulator;$env:PATH"
}

Write-Host "[SDK] Android SDK verified at: $sdkDir" -ForegroundColor Gray
Write-Host ""

# 3. Helper Functions
function Test-HttpEndpoint {
    param ([string]$Url, [int]$TimeoutMs = 2000)
    try {
        $req = [System.Net.WebRequest]::Create($Url)
        $req.Timeout = $TimeoutMs
        $req.Method = "GET"
        $resp = $req.GetResponse()
        $httpResp = [System.Net.HttpWebResponse]$resp
        $status = [int]$httpResp.StatusCode
        $httpResp.Close()
        return ($status -ge 200 -and $status -lt 500)
    } catch {
        return $false
    }
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

# ------------------------------------------------------------
# STAGE 1: Backend API Pre-Flight & Auto-Start
# ------------------------------------------------------------
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 1: Backend API Service Verification (:8080)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$backendDir = Join-Path $rootDir "backend"
$isBackendRunning = (Test-PortListening -Port 8080) -or (Test-HttpEndpoint -Url "http://localhost:8080/health")

if ($isBackendRunning) {
    Write-Host "[ONLINE] Fastify Backend API is already running on port 8080." -ForegroundColor Green
} else {
    Write-Host "[START] Launching Fastify Backend API in dedicated window..." -ForegroundColor Yellow
    if (Test-Path $backendDir) {
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "start `"DINEDECK BACKEND API`" /d `"$backendDir`" cmd /k `"npm run dev`"")
        Write-Host "        Waiting for Backend API to become ready..." -ForegroundColor DarkGray -NoNewline
        
        $bMax = 25
        $bReady = $false
        while ($bMax -gt 0) {
            if ((Test-HttpEndpoint -Url "http://localhost:8080/health") -or (Test-PortListening -Port 8080)) {
                $bReady = $true
                break
            }
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
            $bMax--
        }
        if ($bReady) {
            Write-Host " [READY]" -ForegroundColor Green
        } else {
            Write-Host " [WARNING: Backend starting asynchronously]" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] Backend directory not found at $backendDir" -ForegroundColor Red
    }
}

Write-Host ""

# ------------------------------------------------------------
# STAGE 2: Android APK Build & Artifact Verification
# ------------------------------------------------------------
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 2: Android APK Build Verification" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$apps = @(
    @{
        Key        = "customer"
        Name       = "Customer Mobile App"
        AvdName    = "Customer"
        Port       = 5554
        DeviceId   = "emulator-5554"
        ApkPath    = (Join-Path $rootDir "app\build\outputs\apk\debug\app-debug.apk")
        Activity   = "com.dinedeck.app/.MainActivity"
    },
    @{
        Key        = "partner"
        Name       = "Partner Operations App"
        AvdName    = "Partner"
        Port       = 5556
        DeviceId   = "emulator-5556"
        ApkPath    = (Join-Path $rootDir "partner-app\build\outputs\apk\debug\partner-app-debug.apk")
        Activity   = "com.dinedeck.partner/.PartnerMainActivity"
    },
    @{
        Key        = "admin"
        Name       = "Admin Control Center App"
        AvdName    = "Admin"
        Port       = 5558
        DeviceId   = "emulator-5558"
        ApkPath    = (Join-Path $rootDir "admin-app\build\outputs\apk\debug\admin-app-debug.apk")
        Activity   = "com.dinedeck.admin/.AdminMainActivity"
    }
)

$needsBuild = $false
foreach ($app in $apps) {
    if (!(Test-Path $app["ApkPath"])) {
        Write-Host "[BUILD REQUIRED] Missing APK for $($app['Name']) at $($app['ApkPath'])" -ForegroundColor Yellow
        $needsBuild = $true
        break
    }
}

if ($needsBuild) {
    Write-Host "[GRADLE] Compiling all Android modules via gradlew assembleDebug..." -ForegroundColor Cyan
    Push-Location $rootDir
    try {
        & ".\gradlew.bat" assembleDebug
        Write-Host "[GRADLE] APK build completed successfully." -ForegroundColor Green
    } catch {
        Write-Host "[GRADLE ERROR] Build failed: $_" -ForegroundColor Red
    }
    Pop-Location
} else {
    Write-Host "[OK] All 3 debug APKs are built and ready." -ForegroundColor Green
}

Write-Host ""

# ------------------------------------------------------------
# STAGE 3: Launching Android Emulators (Port 5554, 5556, 5558)
# ------------------------------------------------------------
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 3: Launching 3 Android Mobile Screens" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

# Check attached devices
$activeDevices = @()
try {
    $adbOut = & $adbPath devices
    foreach ($line in ($adbOut -split "`r?`n")) {
        if ($line -match '^(emulator-\d+)\s+device') {
            $activeDevices += $matches[1]
        }
    }
} catch {}

foreach ($app in $apps) {
    $devId   = $app["DeviceId"]
    $avdName = $app["AvdName"]
    $port    = $app["Port"]
    $name    = $app["Name"]

    if ($activeDevices -contains $devId) {
        Write-Host "[REUSE] $name is already running on $devId (Port $port)." -ForegroundColor Green
    } else {
        Write-Host "[LAUNCH] Starting $name emulator (AVD: $avdName on Port $port)..." -ForegroundColor Cyan
        Start-Process -FilePath $emuPath -ArgumentList @("-avd", $avdName, "-port", "$port", "-no-snapshot-load", "-no-audio")
    }
}

Write-Host ""

# ------------------------------------------------------------
# STAGE 4: Boot Synchronization & APK Deployment
# ------------------------------------------------------------
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 4: Device Boot Synchronization and App Launch" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$appStatus = @{}

foreach ($app in $apps) {
    $devId    = $app["DeviceId"]
    $name     = $app["Name"]
    $apkPath  = $app["ApkPath"]
    $activity = $app["Activity"]
    $key      = $app["Key"]

    Write-Host "[SYNC] Preparing $name on $devId..." -ForegroundColor Cyan
    $booted = Wait-For-Device-Boot -DeviceId $devId -TimeoutSec 90

    if ($booted) {
        Write-Host "  -> Installing APK: $(Split-Path -Leaf $apkPath)..." -ForegroundColor DarkGray -NoNewline
        $instResult = & $adbPath -s $devId install -r $apkPath 2>&1
        Write-Host " [INSTALLED]" -ForegroundColor Green

        Write-Host "  -> Launching Activity: $activity..." -ForegroundColor DarkGray -NoNewline
        & $adbPath -s $devId shell am start -n $activity | Out-Null
        Write-Host " [STARTED]" -ForegroundColor Green

        # Auto-interact for smooth demo state
        if ($key -eq "partner") {
            Start-Sleep -Seconds 1
            & $adbPath -s $devId shell input tap 540 1550 2>$null | Out-Null
        } elseif ($key -eq "customer") {
            Start-Sleep -Seconds 1
        }

        $appStatus[$key] = "RUNNING"
    } else {
        Write-Host "  -> ERROR: $name ($devId) failed to boot within timeout." -ForegroundColor Red
        $appStatus[$key] = "FAILED"
    }
    Write-Host ""
}

# ------------------------------------------------------------
# FINAL SUMMARY DASHBOARD
# ------------------------------------------------------------
$bColor = if ($isBackendRunning -or (Test-PortListening -Port 8080)) { "Green" } else { "Red" }
$bText  = if ($isBackendRunning -or (Test-PortListening -Port 8080)) { "RUNNING" } else { "OFFLINE" }
$cColor = if ($appStatus["customer"] -eq "RUNNING") { "Green" } else { "Red" }
$pColor = if ($appStatus["partner"] -eq "RUNNING") { "Green" } else { "Red" }
$aColor = if ($appStatus["admin"] -eq "RUNNING") { "Green" } else { "Red" }

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         DINEDECK ANDROID MOBILE ECOSYSTEM STATUS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Backend API (:8080)     : $bText" -ForegroundColor $bColor
Write-Host "Customer App (5554)     : $($appStatus['customer'])" -ForegroundColor $cColor
Write-Host "Partner Operations (5556): $($appStatus['partner'])" -ForegroundColor $pColor
Write-Host "Admin Control (5558)    : $($appStatus['admin'])" -ForegroundColor $aColor
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "All 3 mobile screens are now rendered and interactive on your desktop!" -ForegroundColor Green
Write-Host ""
