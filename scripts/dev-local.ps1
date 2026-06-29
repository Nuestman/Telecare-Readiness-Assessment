# Local dev on Windows — run API + survey frontend with env from repo-root `.env`
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path ".env")) {
  Write-Host "Missing .env — copy .env.example to .env and set DATABASE_URL (from Replit Secrets)." -ForegroundColor Red
  exit 1
}

Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $name, $value = $_ -split '=', 2
  if ($null -ne $name -and $null -ne $value) {
    Set-Item -Path "env:$($name.Trim())" -Value $value.Trim().Trim('"')
  }
}

if (-not $env:DATABASE_URL) {
  Write-Host "DATABASE_URL is not set in .env" -ForegroundColor Red
  exit 1
}

if (-not $env:PORT) { $env:PORT = "8080" }
if (-not $env:NODE_ENV) { $env:NODE_ENV = "development" }
if (-not $env:TELEHEALTH_PORT) { $env:TELEHEALTH_PORT = "21409" }
if (-not $env:TELEHEALTH_BASE_PATH) { $env:TELEHEALTH_BASE_PATH = "/" }

Write-Host "Building API server ..."
pnpm --filter @workspace/api-server run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting API server on port $env:PORT ..."
$api = Start-Process -FilePath "pnpm" -ArgumentList @(
  "--filter", "@workspace/api-server", "run", "start"
) -WorkingDirectory $Root -PassThru -NoNewWindow

Start-Sleep -Seconds 3

Write-Host "Starting survey frontend on port $env:TELEHEALTH_PORT ..."
$env:PORT = $env:TELEHEALTH_PORT
$env:BASE_PATH = $env:TELEHEALTH_BASE_PATH
pnpm --filter @workspace/telehealth-survey run dev

if ($api -and -not $api.HasExited) {
  Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue
}
