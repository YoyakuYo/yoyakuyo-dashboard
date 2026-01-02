# apps/dashboard/scripts/kill-port.ps1
# PowerShell script to kill processes on a specific port

param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

# Silently check and kill processes on the port
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    
    foreach ($processId in $pids) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            # Only kill if it's a Node.js process (to avoid killing other apps)
            if ($process.ProcessName -eq "node") {
                Write-Host "Stopping Node.js process (PID: $processId) on port $Port..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500  # Brief pause to ensure port is released
            }
        }
    }
} else {
    Write-Host "No process found on port $Port" -ForegroundColor Green
}

