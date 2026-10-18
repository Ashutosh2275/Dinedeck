# ==============================================================================
# DINEDECK - STOP ALL PLATFORM SERVICES (PowerShell Automation Engine)
# ==============================================================================
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "         DINEDECK GRACEFUL SERVICE SHUTDOWN                 " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

$ports = @(
    @{ Port = 8080; Name = "Fastify Backend API" },
    @{ Port = 5173; Name = "Customer Web" },
    @{ Port = 5174; Name = "Partner POS & KDS Web" },
    @{ Port = 5175; Name = "Super Admin Web" }
)

foreach ($item in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $item.Port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -gt 0) {
                    Write-Host "Stopping $($item.Name) (Port $($item.Port), PID $pidToKill)..." -ForegroundColor Cyan
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        } else {
            Write-Host "Port $($item.Port) ($($item.Name)) is already free." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not inspect port $($item.Port): $_" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "All DineDeck web & API service processes have been terminated." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Yellow
