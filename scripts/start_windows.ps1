# Start the FinAlly container on Windows (PowerShell). Idempotent.
# Usage:
#   .\scripts\start_windows.ps1                # build if missing, start
#   .\scripts\start_windows.ps1 -Build         # force rebuild
#   .\scripts\start_windows.ps1 -Open          # open the URL in the browser

param(
    [switch]$Build,
    [switch]$Open
)

$ErrorActionPreference = 'Stop'

$Image     = 'finally:latest'
$Container = 'finally'
$Port      = 8000
$Volume    = 'finally-data'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker is not installed or not on PATH."
}

if (-not (Test-Path '.env')) {
    if (Test-Path '.env.example') {
        Write-Host "No .env found - copying .env.example to .env. Edit it to add your API keys."
        Copy-Item '.env.example' '.env'
    } else {
        Write-Error ".env not found and .env.example missing."
    }
}

$imageExists = $false
try {
    docker image inspect $Image | Out-Null
    $imageExists = $true
} catch {
    $imageExists = $false
}

if ($Build -or -not $imageExists) {
    Write-Host "Building image $Image..."
    docker build -t $Image .
    if ($LASTEXITCODE -ne 0) { Write-Error "docker build failed." }
}

$existing = docker ps -a --filter "name=^$Container$" --format '{{.Names}}'
if ($existing) {
    Write-Host "Removing existing container $Container..."
    docker rm -f $Container | Out-Null
}

Write-Host "Starting container $Container on port $Port..."
docker run -d `
    --name $Container `
    --env-file .env `
    -v "$($Volume):/app/db" `
    -p "$($Port):8000" `
    --restart unless-stopped `
    $Image | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "docker run failed." }

$Url = "http://localhost:$Port"
Write-Host "FinAlly is starting at $Url"
Write-Host "Use 'docker logs -f $Container' to follow logs."

if ($Open) {
    Start-Process $Url
}
