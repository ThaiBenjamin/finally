# Stop and remove the FinAlly container on Windows (PowerShell). Idempotent.
# The named volume is preserved so data persists across restarts.

$ErrorActionPreference = 'Stop'

$Container = 'finally'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker is not installed or not on PATH."
}

$existing = docker ps -a --filter "name=^$Container$" --format '{{.Names}}'
if ($existing) {
    Write-Host "Stopping and removing container $Container..."
    docker rm -f $Container | Out-Null
    Write-Host "Done. Volume 'finally-data' is preserved."
} else {
    Write-Host "Container $Container is not running."
}
