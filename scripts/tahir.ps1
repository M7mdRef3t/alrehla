# Sovereign Maintenance Script (Tahir)
Write-Host "--- Starting Sovereign Cleaning Protocol ---" -ForegroundColor Cyan

# 1. Clean Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "[1/3] Pruning Docker System..." -ForegroundColor Yellow
    docker system prune -f --volumes
}

# 2. Kill Zombie Node Processes
Write-Host "[2/3] Terminating Orphaned Node Processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Clear Temporary Caches
Write-Host "[3/3] Clearing Temp Caches..." -ForegroundColor Yellow
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "--- System Optimized. The Journey is now lighter. ---" -ForegroundColor Green
