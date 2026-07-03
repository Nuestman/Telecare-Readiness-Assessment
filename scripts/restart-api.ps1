# Restart only the API server (keeps Vite frontend running).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $name, $value = $_ -split '=', 2
  if ($null -ne $name -and $null -ne $value) {
    $val = $value.Trim()
    if ($val.Length -ge 2 -and $val[0] -eq [char]34 -and $val[$val.Length - 1] -eq [char]34) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    Set-Item -Path "env:$($name.Trim())" -Value $val
  }
}

if (-not $env:PORT) { $env:PORT = "8080" }
if (-not $env:NODE_ENV) { $env:NODE_ENV = "development" }
if (-not $env:SESSION_SECRET) { $env:SESSION_SECRET = "dev-session-secret-change-in-production" }

$port = [int]$env:PORT
Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    Write-Host "Stopping API process $_ on port $port"
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }

Write-Host "Building API..."
pnpm --filter @workspace/api-server run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting API on port $port"
$pnpmCmd = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
if (-not $pnpmCmd) { $pnpmCmd = (Get-Command pnpm).Source }
Start-Process -FilePath $pnpmCmd -ArgumentList @(
  "--filter", "@workspace/api-server", "run", "start"
) -WorkingDirectory $Root -NoNewWindow

for ($attempt = 1; $attempt -le 10; $attempt++) {
  Start-Sleep -Seconds 2
  try {
    $health = Invoke-RestMethod -Uri "http://localhost:$port/api/healthz" -TimeoutSec 10
    Write-Host "API healthy: $($health.status)"
    exit 0
  } catch {
    if ($attempt -eq 10) {
      Write-Host "API health check failed: $($_.Exception.Message)" -ForegroundColor Red
      exit 1
    }
  }
}
