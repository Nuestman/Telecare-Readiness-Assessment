$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $name, $value = $_ -split '=', 2
  if ($null -ne $name -and $null -ne $value) {
    Set-Item -Path "env:$($name.Trim())" -Value $value.Trim()
  }
}

$base = "http://localhost:8080/api"
$sysSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$studySession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Invoke-Api {
  param(
    [string]$Method = "GET",
    [string]$Path,
    [hashtable]$Body = $null,
    [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession
  )
  $uri = "$base$Path"
  try {
    $params = @{
      Uri        = $uri
      Method     = $Method
      WebSession = $WebSession
      TimeoutSec = 30
    }
    if ($Body) {
      $params.Body = ($Body | ConvertTo-Json -Compress)
      $params.ContentType = "application/json"
    }
    $result = Invoke-RestMethod @params
    return [PSCustomObject]@{ Status = 200; Body = $result }
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { throw }
    $status = [int]$resp.StatusCode
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $raw = $reader.ReadToEnd()
    $parsed = $null
    try { $parsed = $raw | ConvertFrom-Json } catch {}
    return [PSCustomObject]@{ Status = $status; Body = $parsed; Raw = $raw }
  }
}

$fail = 0
function Assert-Ok($name, $result, [int[]]$allowed = @(200)) {
  if ($allowed -notcontains $result.Status) {
    $detail = if ($result.Body.error) { $result.Body.error } else { $result.Raw }
    Write-Host "FAIL $name status=$($result.Status) $detail" -ForegroundColor Red
    $script:fail++
    return
  }
  Write-Host "OK   $name status=$($result.Status)" -ForegroundColor Green
}

Assert-Ok "healthz" (Invoke-Api -Path "/healthz" -WebSession $studySession)
Assert-Ok "studies" (Invoke-Api -Path "/studies" -WebSession $studySession)

$sysLogin = Invoke-Api -Method POST -Path "/system/auth/login" -Body @{
  email    = $env:INITIAL_ADMIN_EMAIL
  password = $env:INITIAL_ADMIN_PASSWORD
} -WebSession $sysSession
Assert-Ok "system login" $sysLogin

$dash = Invoke-Api -Path "/system/dashboard" -WebSession $sysSession
Assert-Ok "system dashboard" $dash

$sysHealth = Invoke-Api -Path "/system/health" -WebSession $sysSession
Assert-Ok "system health" $sysHealth

$studyLogin = Invoke-Api -Method POST -Path "/auth/login" -Body @{
  email    = $env:INITIAL_ADMIN_EMAIL
  password = $env:INITIAL_ADMIN_PASSWORD
} -WebSession $studySession
if ($studyLogin.Status -eq 200) {
  Write-Host "OK   study login status=200" -ForegroundColor Green
  $me = Invoke-Api -Path "/auth/me" -WebSession $studySession
  Assert-Ok "auth/me" $me
  $surveys = Invoke-Api -Path "/studies/telehealth-readiness/surveys" -WebSession $studySession
  Assert-Ok "study surveys" $surveys
} else {
  Write-Host "SKIP study login status=$($studyLogin.Status)" -ForegroundColor Yellow
}

if ($fail -gt 0) { exit 1 }
Write-Host "Smoke checks passed." -ForegroundColor Green
