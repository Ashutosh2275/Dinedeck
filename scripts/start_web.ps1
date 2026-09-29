# ==============================================================================
# DINEDECK - THREE WEB APPS + BACKEND ONE-CLICK LAUNCHER (PowerShell Engine)
# Supports Backend API (:8080), Customer Web (:5173), Partner Web (:5174), Control Center Web (:5175)
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       DINEDECK - THREE WEB APPS ONE-CLICK LAUNCHER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Determine workspace root
$PSScriptRootDirectory = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($PSScriptRootDirectory)) {
    $rootDir = "D:\DINEDECK"
} else {
    $rootDir = $PSScriptRootDirectory
}

if (!(Test-Path $rootDir)) {
    if (Test-Path "D:\Dindeck") {
        $rootDir = "D:\Dindeck"
    } else {
        Write-Host "[FATAL] Workspace directory not found: $rootDir" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[WORKSPACE] Using DINEDECK Root: $rootDir" -ForegroundColor Gray
Write-Host ""

# Service Definitions
$services = @(
    @{
        Key         = "backend"
        Name        = "Fastify API Backend"
        WindowTitle = "DINEDECK BACKEND API"
        Path        = (Join-Path $rootDir "backend")
        Port        = 8080
        Url         = "http://localhost:8080/health"
        IsOpenTab   = $false
    },
    @{
        Key         = "customer"
        Name        = "Customer Web"
        WindowTitle = "DINEDECK CUSTOMER WEB"
        Path        = (Join-Path $rootDir "customer-web")
        Port        = 5173
        Url         = "http://localhost:5173"
        IsOpenTab   = $true
    },
    @{
        Key         = "partner"
        Name        = "Partner Web"
        WindowTitle = "DINEDECK PARTNER WEB"
        Path        = (Join-Path $rootDir "partner-web")
        Port        = 5174
        Url         = "http://localhost:5174"
        IsOpenTab   = $true
    },
    @{
        Key         = "admin"
        Name        = "Control Center Web"
        WindowTitle = "DINEDECK CONTROL CENTER WEB"
        Path        = (Join-Path $rootDir "admin-web")
        Port        = 5175
        Url         = "http://localhost:5175"
        IsOpenTab   = $true
    }
)

# Helper: Test HTTP Connectivity
function Test-HttpEndpoint {
    param (
        [string]$Url,
        [int]$TimeoutMs = 2500
    )
    try {
        $req = [System.Net.WebRequest]::Create($Url)
        $req.Timeout = $TimeoutMs
        $req.Method = "GET"
        $resp = $req.GetResponse()
        $httpResp = [System.Net.HttpWebResponse]$resp
        $status = [int]$httpResp.StatusCode
        $httpResp.Close()
        if ($status -ge 200 -and $status -lt 400) {
            return $true
        }
    } catch [System.Net.WebException] {
        if ($_.Response) {
            $httpResp = [System.Net.HttpWebResponse]$_.Response
            $status = [int]$httpResp.StatusCode
            $httpResp.Close()
            if ($status -ge 200 -and $status -lt 400) {
                return $true
            }
        }
    } catch {}
    return $false
}

# Helper: Check if Port is active
function Test-PortListening {
    param ([int]$Port)
    try {
        $tcp = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($tcp) { return $true }
    } catch {}

    if (Test-HttpEndpoint -Url ("http://localhost:" + $Port) -TimeoutMs 600) {
        return $true
    }

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

    try {
        $client6 = New-Object System.Net.Sockets.TcpClient([System.Net.Sockets.AddressFamily]::InterNetworkV6)
        $iar6 = $client6.BeginConnect([System.Net.IPAddress]::IPv6Loopback, $Port, $null, $null)
        $success6 = $iar6.AsyncWaitHandle.WaitOne(300)
        if ($success6 -and $client6.Connected) {
            $client6.EndConnect($iar6)
            $client6.Close()
            return $true
        }
        $client6.Close()
    } catch {}

    return $false
}

# Helper: Get Owning PID on Port
function Get-PortPid {
    param ([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($conn -and $conn.OwningProcess) {
            return $conn.OwningProcess
        }
    } catch {}
    return $null
}

# Helper: Locate Chrome
function Find-ChromePath {
    $regPaths = @(
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe",
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
    )
    foreach ($reg in $regPaths) {
        try {
            $val = (Get-ItemProperty $reg -ErrorAction SilentlyContinue).'(default)'
            if ($val -and (Test-Path $val)) {
                return $val
            }
        } catch {}
    }

    $commonPaths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
    )
    foreach ($p in $commonPaths) {
        if (Test-Path $p) {
            return $p
        }
    }
    return $null
}

# Track service status
$svcStatus = @{}
$svcReasons = @{}

Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 1: Workspace & Directory Health Verification" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

foreach ($svc in $services) {
    $key  = $svc["Key"]
    $name = $svc["Name"]
    $path = $svc["Path"]

    Write-Host "[CHECK] Verifying $name directory: $path" -ForegroundColor Gray
    if (!(Test-Path $path)) {
        Write-Host "  -> ERROR: Directory does not exist!" -ForegroundColor Red
        $svcStatus[$key] = "FAILED"
        $svcReasons[$key] = "Directory $path does not exist"
        continue
    }

    $packageJson = Join-Path $path "package.json"
    if (!(Test-Path $packageJson)) {
        Write-Host "  -> ERROR: package.json missing in $path!" -ForegroundColor Red
        $svcStatus[$key] = "FAILED"
        $svcReasons[$key] = "package.json missing in $path"
        continue
    }

    $nodeModules = Join-Path $path "node_modules"
    if (!(Test-Path $nodeModules)) {
        Write-Host "  -> node_modules missing. Installing dependencies for $name..." -ForegroundColor Yellow
        Push-Location $path
        try {
            npm install --no-audit --no-fund
            Write-Host "  -> Dependencies installed successfully." -ForegroundColor Green
        } catch {
            Write-Host "  -> npm install failed for $name : $_" -ForegroundColor Red
            $svcStatus[$key] = "FAILED"
            $svcReasons[$key] = "npm install failed"
            Pop-Location
            continue
        }
        Pop-Location
    } else {
        Write-Host "  -> Dependencies verified (node_modules present)." -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 2: Server Startup and Port Reuse Check" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

foreach ($svc in $services) {
    $key  = $svc["Key"]
    $name = $svc["Name"]
    $port = [int]$svc["Port"]
    $path = $svc["Path"]
    $winTitle = $svc["WindowTitle"]

    if ($svcStatus.ContainsKey($key) -and $svcStatus[$key] -eq "FAILED") {
        continue
    }

    $isListening = Test-PortListening -Port $port
    if ($isListening) {
        $pidNum = Get-PortPid -Port $port
        $pidStr = ""
        if ($pidNum) { $pidStr = " (PID: $pidNum)" }
        Write-Host "[REUSE] $name is already running on port $port$pidStr." -ForegroundColor Green
        Write-Host "        Skipping duplicate process creation." -ForegroundColor DarkGray
    } else {
        Write-Host "[START] Launching $name on port $port..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "start `"$winTitle`" /d `"$path`" cmd /k `"npm run dev`"")
        Write-Host "        Started terminal window: '$winTitle'" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 3: Health Verification (HTTP Connectivity)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$urlsToOpen = @()

foreach ($svc in $services) {
    $key       = $svc["Key"]
    $name      = $svc["Name"]
    $url       = $svc["Url"]
    $port      = $svc["Port"]
    $isOpenTab = $svc["IsOpenTab"]

    if ($svcStatus.ContainsKey($key) -and $svcStatus[$key] -eq "FAILED") {
        $reason = $svcReasons[$key]
        Write-Host "[FAILED] $name -> Skipped due to setup failure: $reason" -ForegroundColor Red
        continue
    }

    Write-Host "[POLL] Checking health for $name at $url..." -ForegroundColor Cyan -NoNewline
    
    $ready = $false
    $maxTries = 35
    while ($maxTries -gt 0) {
        if (Test-HttpEndpoint -Url $url -TimeoutMs 1500) {
            $ready = $true
            break
        }
        Write-Host "." -NoNewline
        Start-Sleep -Milliseconds 1000
        $maxTries--
    }

    if ($ready) {
        Write-Host " [ONLINE 200 OK]" -ForegroundColor Green
        $svcStatus[$key] = "RUNNING"
        if ($isOpenTab) {
            $urlsToOpen += $url
        }
    } else {
        Write-Host " [FAILED / TIMEOUT]" -ForegroundColor Red
        $svcStatus[$key] = "FAILED"
        $svcReasons[$key] = "HTTP endpoint did not respond within timeout on port $port"
        $nameUpper = $name.ToUpper()
        Write-Host "         $nameUpper -> FAILED" -ForegroundColor Red
        Write-Host "         Reason -> $($svcReasons[$key])" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "STAGE 4: Browser Integration (Google Chrome)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

if ($urlsToOpen.Count -gt 0) {
    $chromePath = Find-ChromePath
    if ($chromePath) {
        Write-Host "[CHROME] Opening $($urlsToOpen.Count) verified app(s) in Google Chrome..." -ForegroundColor Cyan
        Write-Host "         Executable: $chromePath" -ForegroundColor DarkGray
        try {
            foreach ($targetUrl in $urlsToOpen) {
                Start-Process -FilePath $chromePath -ArgumentList $targetUrl -ErrorAction Stop
                Start-Sleep -Milliseconds 300
            }
            Write-Host "         [OK] Google Chrome tabs opened." -ForegroundColor Green
        } catch {
            Write-Host "         [WARNING] Failed to launch Chrome process: $_" -ForegroundColor Yellow
            Write-Host "         Falling back to system default browser..." -ForegroundColor Yellow
            foreach ($targetUrl in $urlsToOpen) {
                Start-Process $targetUrl
            }
        }
    } else {
        Write-Host "[WARNING] Google Chrome not found in standard paths." -ForegroundColor Yellow
        Write-Host "          Falling back to default system browser for verified endpoints..." -ForegroundColor Yellow
        foreach ($targetUrl in $urlsToOpen) {
            Start-Process $targetUrl
        }
    }
} else {
    Write-Host "[BROWSER] No active web endpoints verified. Browser launch skipped." -ForegroundColor Yellow
}

Write-Host ""
# Final Summary Output
$backStatus  = if ($svcStatus.ContainsKey("backend") -and $svcStatus["backend"] -eq "RUNNING") { "RUNNING" } else { "FAILED" }
$custStatus  = if ($svcStatus.ContainsKey("customer") -and $svcStatus["customer"] -eq "RUNNING") { "RUNNING" } else { "FAILED" }
$partStatus  = if ($svcStatus.ContainsKey("partner") -and $svcStatus["partner"] -eq "RUNNING") { "RUNNING" } else { "FAILED" }
$adminStatus = if ($svcStatus.ContainsKey("admin") -and $svcStatus["admin"] -eq "RUNNING") { "RUNNING" } else { "FAILED" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DINEDECK ECOSYSTEM STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fastify API Backend: $backStatus" -ForegroundColor $(if ($backStatus -eq "RUNNING") { "Green" } else { "Red" })
Write-Host "Customer Web       : $custStatus" -ForegroundColor $(if ($custStatus -eq "RUNNING") { "Green" } else { "Red" })
Write-Host "Partner Web        : $partStatus" -ForegroundColor $(if ($partStatus -eq "RUNNING") { "Green" } else { "Red" })
Write-Host "Control Center Web : $adminStatus" -ForegroundColor $(if ($adminStatus -eq "RUNNING") { "Green" } else { "Red" })
Write-Host ""
Write-Host "Backend API URL    : http://localhost:8080" -ForegroundColor White
Write-Host "Customer URL       : http://localhost:5173" -ForegroundColor White
Write-Host "Partner URL        : http://localhost:5174" -ForegroundColor White
Write-Host "Control Center URL : http://localhost:5175" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

if ($backStatus -eq "FAILED" -and $svcReasons.ContainsKey("backend")) {
    $r = $svcReasons["backend"]
    Write-Host "`n[DIAGNOSTICS] Backend API Failure: $r" -ForegroundColor Red
}
if ($custStatus -eq "FAILED" -and $svcReasons.ContainsKey("customer")) {
    $r = $svcReasons["customer"]
    Write-Host "`n[DIAGNOSTICS] Customer Web Failure: $r" -ForegroundColor Red
}
if ($partStatus -eq "FAILED" -and $svcReasons.ContainsKey("partner")) {
    $r = $svcReasons["partner"]
    Write-Host "`n[DIAGNOSTICS] Partner Web Failure: $r" -ForegroundColor Red
}
if ($adminStatus -eq "FAILED" -and $svcReasons.ContainsKey("admin")) {
    $r = $svcReasons["admin"]
    Write-Host "`n[DIAGNOSTICS] Control Center Web Failure: $r" -ForegroundColor Red
}

Write-Host ""
