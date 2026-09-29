# DINEDECK Production Development Launcher & Ecosystem Manager
# Powershell Execution Engine

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action = "start",

    [Parameter(Mandatory=$false)]
    [switch]$NoBrowser,

    [Parameter(Mandatory=$false)]
    [switch]$StopEmulators
)

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "       DINEDECK ECOSYSTEM CONTROL ENGINE" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Environment & Path Verification
$rootDir = "D:\DINEDECK"
if (!(Test-Path $rootDir)) {
    $rootDir = "D:\Dindeck"
}
$sdkDir = "D:\Android\Sdk"
$adbPath = "$sdkDir\platform-tools\adb.exe"
$emuPath = "$sdkDir\emulator\emulator.exe"

if (!(Test-Path $rootDir)) {
    Write-Host "[FATAL] Root directory D:\DINEDECK not found!" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $sdkDir)) {
    Write-Host "[WARNING] Android SDK not found at $sdkDir. Emulator launch will be skipped." -ForegroundColor Yellow
    $hasAndroid = $false
} else {
    $hasAndroid = $true
    $env:ANDROID_HOME = $sdkDir
    $env:ANDROID_SDK_ROOT = $sdkDir
    if ($env:PATH -notlike "*$sdkDir\platform-tools*") {
        $env:PATH = "$sdkDir\platform-tools;$sdkDir\emulator;$env:PATH"
    }
}

# Helper: Check if a Port is occupied
function Get-PortProcess {
    param ([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($conn -and $conn.OwningProcess) {
            return (Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue)
        }
    } catch {}
    return $null
}

# Helper: Wait for HTTP Status 200
function Wait-For-Http {
    param (
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 40
    )
    Write-Host "[WAIT] Waiting for $Name ($Url)..." -ForegroundColor Yellow -NoNewline
    $start = Get-Date
    while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
        try {
            $res = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($res -and ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400)) {
                Write-Host " [OK] ($($res.StatusCode))" -ForegroundColor Green
                return $true
            }
        } catch {}
        Start-Sleep -Milliseconds 1200
        Write-Host "." -NoNewline
    }
    Write-Host " [TIMEOUT]" -ForegroundColor Red
    return $false
}

# Helper: Get AVD Name for Device
function Get-AvdName {
    param ([string]$DeviceId)
    try {
        $name = & $adbPath -s $DeviceId shell getprop ro.boot.qemu.avd_name 2>$null
        if ($name) { return $name.Trim() }
    } catch {}
    return "Unknown"
}

# Helper: Wait for Boot Completion
function Wait-For-Boot {
    param ([string]$DeviceId, [int]$TimeoutSeconds = 90)
    Write-Host "[WAIT] Waiting for $DeviceId to complete boot..." -ForegroundColor Yellow -NoNewline
    $start = Get-Date
    while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
        try {
            $boot = & $adbPath -s $DeviceId shell getprop sys.boot_completed 2>$null
            if ($boot -and $boot.Trim() -eq "1") {
                Write-Host " [BOOT COMPLETE]" -ForegroundColor Green
                return $true
            }
        } catch {}
        Start-Sleep -Seconds 3
        Write-Host "." -NoNewline
    }
    Write-Host " [BOOT TIMEOUT]" -ForegroundColor Yellow
    return $false
}

# STOP ACTION
function Stop-DinedeckServices {
    param ([bool]$KillEmu = $false)
    Write-Host "[STOP] Stopping DINEDECK services..." -ForegroundColor Yellow

    $ports = @(8080, 5173, 5174, 5175)
    foreach ($p in $ports) {
        $proc = Get-PortProcess -Port $p
        if ($proc) {
            Write-Host "  -> Terminating process on port $p (PID: $($proc.Id), Name: $($proc.ProcessName))..." -ForegroundColor DarkYellow
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "     [KILLED] Port $p freed." -ForegroundColor Green
            } catch {
                Write-Host "     [ERROR] Failed killing PID $($proc.Id)" -ForegroundColor Red
            }
        } else {
            Write-Host "  -> Port $p is already free." -ForegroundColor DarkGray
        }
    }

    if ($KillEmu -and $hasAndroid) {
        Write-Host "[STOP] Stopping Android Emulators..." -ForegroundColor Yellow
        $devs = & $adbPath devices | Select-String "emulator-" | ForEach-Object { ($_ -split "`t")[0].Trim() }
        foreach ($d in $devs) {
            Write-Host "  -> Shutting down emulator $d..." -ForegroundColor DarkYellow
            & $adbPath -s $d emu kill 2>$null
        }
    }
    Write-Host "[OK] Stop routine completed.`n" -ForegroundColor Green
}

# START ACTION
function Start-DinedeckServices {
    Write-Host "[1/4] Inspecting Web & API Ports..." -ForegroundColor Cyan

    # 1. Backend Server (:8080)
    $bProc = Get-PortProcess -Port 8080
    if (!$bProc) {
        Write-Host "  -> Starting Fastify Backend on port 8080..." -ForegroundColor Yellow
        Start-Process cmd.exe -ArgumentList "/c title DINEDECK Backend :8080 && cd /d $rootDir\backend && npx tsx src/index.ts" -WindowStyle Minimized
    } else {
        Write-Host "  -> Fastify Backend is already active on port 8080 (PID: $($bProc.Id))." -ForegroundColor Green
    }

    # 2. Customer Web (:5173)
    $cwProc = Get-PortProcess -Port 5173
    if (!$cwProc) {
        Write-Host "  -> Starting Customer Web on port 5173..." -ForegroundColor Yellow
        Start-Process cmd.exe -ArgumentList "/c title DINEDECK Customer Web :5173 && cd /d $rootDir\customer-web && npm run dev" -WindowStyle Minimized
    } else {
        Write-Host "  -> Customer Web is already active on port 5173 (PID: $($cwProc.Id))." -ForegroundColor Green
    }

    # 3. Partner Web (:5174)
    $pwProc = Get-PortProcess -Port 5174
    if (!$pwProc) {
        Write-Host "  -> Starting Partner Web on port 5174..." -ForegroundColor Yellow
        Start-Process cmd.exe -ArgumentList "/c title DINEDECK Partner Web :5174 && cd /d $rootDir\partner-web && npm run dev" -WindowStyle Minimized
    } else {
        Write-Host "  -> Partner Web is already active on port 5174 (PID: $($pwProc.Id))." -ForegroundColor Green
    }

    # 4. Admin Web (:5175)
    $awProc = Get-PortProcess -Port 5175
    if (!$awProc) {
        Write-Host "  -> Starting Control Center Web on port 5175..." -ForegroundColor Yellow
        Start-Process cmd.exe -ArgumentList "/c title DINEDECK Admin Web :5175 && cd /d $rootDir\admin-web && npm run dev" -WindowStyle Minimized
    } else {
        Write-Host "  -> Control Center Web is already active on port 5175 (PID: $($awProc.Id))." -ForegroundColor Green
    }

    Write-Host "`n[2/4] Verifying HTTP Endpoints Health..." -ForegroundColor Cyan
    $bOk = Wait-For-Http -Url "http://localhost:8080/api/health" -Name "Backend API"
    $cwOk = Wait-For-Http -Url "http://localhost:5173" -Name "Customer Web"
    $pwOk = Wait-For-Http -Url "http://localhost:5174" -Name "Partner Web"
    $awOk = Wait-For-Http -Url "http://localhost:5175" -Name "Control Center Web"

    $custAppOk = $false
    $partAppOk = $false
    $adminAppOk = $false

    if ($hasAndroid) {
        Write-Host "`n[3/4] Checking Android Emulators..." -ForegroundColor Cyan

        $devLines = & $adbPath devices | Select-String "emulator-" | ForEach-Object { ($_ -split "`t")[0].Trim() }
        $runningAvds = @{}

        foreach ($d in $devLines) {
            $avd = Get-AvdName -DeviceId $d
            if ($avd) {
                $runningAvds[$avd] = $d
                Write-Host "  -> Detected Active Emulator: $d ($avd)" -ForegroundColor Green
            }
        }

        # Launch Missing Emulators
        $needed = @("Customer", "Partner", "Admin")
        foreach ($avd in $needed) {
            if (!$runningAvds.ContainsKey($avd)) {
                Write-Host "  -> Launching AVD: $avd..." -ForegroundColor Yellow
                Start-Process cmd.exe -ArgumentList "/c title Android AVD: $avd && & '$emuPath' -avd '$avd' -no-boot-anim -no-snapshot-load -no-audio" -WindowStyle Minimized
            }
        }

        # Polling to get all 3 online
        Write-Host "[WAIT] Polling emulators to establish ADB connectivity..." -ForegroundColor Yellow
        $maxTries = 15
        while ($maxTries -gt 0) {
            $devLines = & $adbPath devices | Select-String "emulator-" | ForEach-Object { ($_ -split "`t")[0].Trim() }
            if ($devLines.Count -ge 3) { break }
            Start-Sleep -Seconds 3
            $maxTries--
        }

        $devLines = & $adbPath devices | Select-String "emulator-" | ForEach-Object { ($_ -split "`t")[0].Trim() }
        $activeMap = @{}
        foreach ($d in $devLines) {
            $avd = Get-AvdName -DeviceId $d
            if ($avd -and $avd -ne "Unknown") {
                $activeMap[$avd] = $d
                Write-Host "  -> Active Mapping: $avd -> $d" -ForegroundColor Green
            }
        }

        Write-Host "`n[4/4] Launching Android Applications..." -ForegroundColor Cyan

        # 1. Customer App (com.dinedeck.app/.MainActivity)
        if ($activeMap.ContainsKey("Customer")) {
            $devId = $activeMap["Customer"]
            Wait-For-Boot -DeviceId $devId
            $pkgCheck = & $adbPath -s $devId shell pm list packages com.dinedeck.app 2>$null
            if ($pkgCheck -match "com.dinedeck.app") {
                & $adbPath -s $devId shell monkey -p com.dinedeck.app 1 | Out-Null
                $avdLabel = Get-AvdName -DeviceId $devId
                Write-Host "  -> [OK] Customer App launched on $devId ($avdLabel)" -ForegroundColor Green
                $custAppOk = $true
            } else {
                Write-Host "  -> [WARNING] com.dinedeck.app is not installed on $devId. Run gradle installDebug." -ForegroundColor Yellow
            }
        }

        # 2. Partner App (com.dinedeck.partner/.PartnerMainActivity)
        if ($activeMap.ContainsKey("Partner")) {
            $devId = $activeMap["Partner"]
            Wait-For-Boot -DeviceId $devId
            $pkgCheck = & $adbPath -s $devId shell pm list packages com.dinedeck.partner 2>$null
            if ($pkgCheck -match "com.dinedeck.partner") {
                & $adbPath -s $devId shell monkey -p com.dinedeck.partner 1 | Out-Null
                $avdLabel = Get-AvdName -DeviceId $devId
                Write-Host "  -> [OK] Partner App launched on $devId ($avdLabel)" -ForegroundColor Green
                $partAppOk = $true
            } else {
                Write-Host "  -> [WARNING] com.dinedeck.partner is not installed on $devId. Run gradle installDebug." -ForegroundColor Yellow
            }
        }

        # 3. Admin App (com.dinedeck.admin/.AdminMainActivity)
        if ($activeMap.ContainsKey("Admin")) {
            $devId = $activeMap["Admin"]
            Wait-For-Boot -DeviceId $devId
            $pkgCheck = & $adbPath -s $devId shell pm list packages com.dinedeck.admin 2>$null
            if ($pkgCheck -match "com.dinedeck.admin") {
                & $adbPath -s $devId shell monkey -p com.dinedeck.admin 1 | Out-Null
                $avdLabel = Get-AvdName -DeviceId $devId
                Write-Host "  -> [OK] Admin Control Center App launched on $devId ($avdLabel)" -ForegroundColor Green
                $adminAppOk = $true
            } else {
                Write-Host "  -> [WARNING] com.dinedeck.admin is not installed on $devId. Run gradle installDebug." -ForegroundColor Yellow
            }
        }
    }

    # Open Browser Tabs automatically
    if (!$NoBrowser) {
        Write-Host "`n[BROWSER] Launching Chrome Web Platform..." -ForegroundColor Cyan
        try {
            Start-Process "chrome.exe" "http://localhost:5173" -ErrorAction SilentlyContinue
            Start-Process "chrome.exe" "http://localhost:5174" -ErrorAction SilentlyContinue
            Start-Process "chrome.exe" "http://localhost:5175" -ErrorAction SilentlyContinue
        } catch {
            Start-Process "http://localhost:5173"
            Start-Process "http://localhost:5174"
            Start-Process "http://localhost:5175"
        }
    }

    # Final Dashboard Display
    Write-Host "`n========================================" -ForegroundColor White
    Write-Host "       DINEDECK ECOSYSTEM" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor White

    Write-Host ("`nBackend       : " + ($(if ($bOk) {"RUNNING"} else {"OFFLINE"}))) -ForegroundColor $(if ($bOk) {"Green"} else {"Red"})
    Write-Host ("Customer Web  : " + ($(if ($cwOk) {"RUNNING"} else {"OFFLINE"}))) -ForegroundColor $(if ($cwOk) {"Green"} else {"Red"})
    Write-Host ("Partner Web   : " + ($(if ($pwOk) {"RUNNING"} else {"OFFLINE"}))) -ForegroundColor $(if ($pwOk) {"Green"} else {"Red"})
    Write-Host ("Admin Web     : " + ($(if ($awOk) {"RUNNING"} else {"OFFLINE"}))) -ForegroundColor $(if ($awOk) {"Green"} else {"Red"})

    Write-Host ("`nCustomer App  : " + ($(if ($custAppOk) {"RUNNING"} else {"NOT READY"}))) -ForegroundColor $(if ($custAppOk) {"Green"} else {"Yellow"})
    Write-Host ("Partner App   : " + ($(if ($partAppOk) {"RUNNING"} else {"NOT READY"}))) -ForegroundColor $(if ($partAppOk) {"Green"} else {"Yellow"})
    Write-Host ("Admin App     : " + ($(if ($adminAppOk) {"RUNNING"} else {"NOT READY"}))) -ForegroundColor $(if ($adminAppOk) {"Green"} else {"Yellow"})

    Write-Host "`n========================================`n" -ForegroundColor White
}

# Main Execution Switch
switch ($Action.ToLower()) {
    "start" {
        Start-DinedeckServices
    }
    "stop" {
        Stop-DinedeckServices -KillEmu:$StopEmulators
    }
    "restart" {
        Stop-DinedeckServices -KillEmu:$StopEmulators
        Start-Sleep -Seconds 3
        Start-DinedeckServices
    }
    "status" {
        Write-Host "[STATUS CHECK] Polling all ports..." -ForegroundColor Cyan
        $b = Get-PortProcess -Port 8080
        $cw = Get-PortProcess -Port 5173
        $pw = Get-PortProcess -Port 5174
        $aw = Get-PortProcess -Port 5175

        Write-Host "Port 8080 (Backend)     : $(if ($b) {'ACTIVE (PID: ' + $b.Id + ')'} else {'FREE'})"
        Write-Host "Port 5173 (Customer Web): $(if ($cw) {'ACTIVE (PID: ' + $cw.Id + ')'} else {'FREE'})"
        Write-Host "Port 5174 (Partner Web) : $(if ($pw) {'ACTIVE (PID: ' + $pw.Id + ')'} else {'FREE'})"
        Write-Host "Port 5175 (Admin Web)   : $(if ($aw) {'ACTIVE (PID: ' + $aw.Id + ')'} else {'FREE'})"
    }
}
