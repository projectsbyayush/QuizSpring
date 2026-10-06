<#
  QuizSpring one-click local runner.

  Usage (right-click > Run with PowerShell, or from the VSCode terminal):
    .\run.ps1            Full stack  - backend + frontend against the database
    .\run.ps1 -Demo      Demo mode   - frontend only, no database needed
    .\run.ps1 -Stop      Stop anything this script started earlier

  Requires the backend jar. Build it once with:
    cd backend; mvn package -DskipTests; cd ..
#>
param(
  [switch]$Demo,
  [switch]$Stop
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logs = Join-Path $root 'logs'
$stateFile = Join-Path $root '.run-state.json'

$FrontendPort = 5173
$BackendPort = 8080

function Write-Step($text) { Write-Host "==> $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "    $text" -ForegroundColor Green }
function Write-Bad($text) { Write-Host "    $text" -ForegroundColor Red }
function Write-Note($text) { Write-Host "    $text" -ForegroundColor Gray }

function Get-PortOwner([int]$Port) {
  try {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop | Select-Object -First 1
    return $conn.OwningProcess
  } catch {
    return $null
  }
}

function Wait-ForPort([int]$Port, [int]$Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (Get-PortOwner $Port) { return $true }
    Start-Sleep -Milliseconds 800
  }
  return $false
}

function Wait-ForHealth([string]$Url, [int]$Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) { return $true }
    } catch { }
    Start-Sleep -Seconds 2
  }
  return $false
}

function Show-LogTail([string]$Path, [int]$Lines = 25) {
  if (-not (Test-Path $Path)) { return }
  Write-Bad "Last lines from $(Split-Path -Leaf $Path):"
  Get-Content -LiteralPath $Path -Tail $Lines | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
}

function Show-RootCause([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  $causes = Select-String -Path $Path -Pattern 'Caused by:.*(FATAL|SQLException|PSQLException|UnknownHostException|Connection refused)' |
    Select-Object -Last 3
  if ($causes) {
    Write-Host ''
    Write-Bad 'Root cause:'
    foreach ($line in $causes) { Write-Host "      $($line.Line.Trim())" -ForegroundColor Red }
    Write-Host ''
    Write-Note 'A database error here is almost always one of:'
    Write-Note '  - project is paused in the Supabase dashboard'
    Write-Note '  - DATABASE_URL region is wrong (copy the Session Pooler host verbatim)'
    Write-Note '  - DATABASE_USERNAME must be postgres.<project-ref> when using the pooler'
  }
}

function Save-State($ids) {
  $ids | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
}

function Load-State {
  if (Test-Path $stateFile) {
    try { return (Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json) } catch { return $null }
  }
  return $null
}

# ---------------------------------------------------------------- stop mode
if ($Stop) {
  Write-Step 'Stopping QuizSpring'
  $state = Load-State
  $targets = @()
  if ($state) { $targets += @($state.frontend, $state.backend) }
  foreach ($port in @($FrontendPort, $BackendPort)) {
    $owner = Get-PortOwner $port
    if ($owner) { $targets += $owner }
  }
  $targets = $targets | Where-Object { $_ } | Select-Object -Unique
  if (-not $targets) {
    Write-Note 'Nothing was running.'
  } else {
    foreach ($id in $targets) {
      try {
        Stop-Process -Id $id -Force -ErrorAction Stop
        Write-Ok "Stopped process $id"
      } catch {
        Write-Note "Could not stop $id (may already be gone)."
      }
    }
  }
  if (Test-Path $stateFile) { Remove-Item -LiteralPath $stateFile -Force }
  Write-Host ''
  Write-Host 'Stopped.' -ForegroundColor Cyan
  exit 0
}

# ------------------------------------------------------------- preflight
Write-Host ''
Write-Host 'QuizSpring' -ForegroundColor White
Write-Host '---------------------------------------------'

if (-not (Test-Path (Join-Path $root 'package.json'))) {
  Write-Bad 'package.json not found. Run this script from the project root.'
  exit 1
}

New-Item -ItemType Directory -Path $logs -Force | Out-Null

$viteScript = Join-Path $root 'node_modules\vite\bin\vite.js'
if (-not (Test-Path $viteScript)) {
  Write-Bad 'node_modules missing. Run: npm install'
  exit 1
}

# ------------------------------------------------------------- demo mode
if ($Demo) {
  Write-Step 'Starting frontend in DEMO mode (no database required)'
  $frontendOwner = Get-PortOwner $FrontendPort
  if ($frontendOwner) {
    Write-Note "Port $FrontendPort already in use by process $frontendOwner. Stop it first with: .\run.ps1 -Stop"
    exit 1
  }
  $env:VITE_DEMO_MODE = 'true'
  $frontendLog = Join-Path $logs 'frontend-demo.log'
  $node = (Get-Command node -ErrorAction Stop).Source
  $process = Start-Process -FilePath $node -ArgumentList $viteScript -WorkingDirectory $root `
    -RedirectStandardOutput $frontendLog -RedirectStandardError (Join-Path $logs 'frontend-demo.err.log') `
    -WindowStyle Hidden -PassThru
  if (Wait-ForPort $FrontendPort 45) {
    Save-State @{ frontend = $process.Id; backend = $null }
    Write-Host ''
    Write-Ok "Demo running at  http://localhost:$FrontendPort"
    Write-Note 'Demo account: use "Try a demo account" on the login page.'
    Write-Note 'The admin panel is reachable in demo mode at /admin'
    Write-Host ''
    Write-Note 'Stop with: .\run.ps1 -Stop'
    exit 0
  }
  Write-Bad "Frontend did not start. Log: $frontendLog"
  Show-LogTail $frontendLog 20
  exit 1
}

# ------------------------------------------------------------- full stack
$jar = Join-Path $root 'backend\target\quiz-platform-api-0.1.0.jar'
if (-not (Test-Path $jar)) {
  Write-Bad 'Backend jar not found.'
  Write-Note 'Build it once with:  cd backend; mvn package -DskipTests; cd ..'
  exit 1
}

Write-Step 'Checking ports'
$backendOwner = Get-PortOwner $BackendPort
$frontendOwner = Get-PortOwner $FrontendPort
if ($backendOwner -or $frontendOwner) {
  if ($backendOwner) { Write-Note "Backend port $BackendPort busy (process $backendOwner)." }
  if ($frontendOwner) { Write-Note "Frontend port $FrontendPort busy (process $frontendOwner)." }
  Write-Note 'Stop them with:  .\run.ps1 -Stop'
  exit 1
}
Write-Ok "Ports $BackendPort and $FrontendPort are free"

Write-Step 'Starting backend'
$backendLog = Join-Path $logs 'backend.log'
$backendErr = Join-Path $logs 'backend.err.log'
$backend = Start-Process -FilePath 'java' `
  -ArgumentList '-jar', "`"$jar`"", '--spring.profiles.active=dev' `
  -WorkingDirectory (Join-Path $root 'backend') `
  -RedirectStandardOutput $backendLog -RedirectStandardError $backendErr `
  -WindowStyle Hidden -PassThru

$healthUrl = "http://localhost:$BackendPort/actuator/health"
if (Wait-ForHealth $healthUrl 120) {
  Write-Ok "Backend is up at http://localhost:$BackendPort"
} else {
  Write-Bad 'Backend failed to become healthy.'
  Write-Note "Log: $backendLog"
  Show-LogTail $backendLog 15
  Show-RootCause $backendLog
  try { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue } catch { }
  Write-Host ''
  Write-Note 'Want to run without a database? Try:  .\run.ps1 -Demo'
  exit 1
}

Write-Step 'Starting frontend'
$frontendLog = Join-Path $logs 'frontend.log'
$node = (Get-Command node -ErrorAction Stop).Source
$frontend = Start-Process -FilePath $node -ArgumentList $viteScript -WorkingDirectory $root `
  -RedirectStandardOutput $frontendLog -RedirectStandardError (Join-Path $logs 'frontend.err.log') `
  -WindowStyle Hidden -PassThru

if (Wait-ForPort $FrontendPort 45) {
  Save-State @{ backend = $backend.Id; frontend = $frontend.Id }
  Write-Host ''
  Write-Ok 'QuizSpring is running'
  Write-Host "      Frontend  http://localhost:$FrontendPort"
  Write-Host "      Backend   http://localhost:$BackendPort/actuator/health"
  Write-Host ''
  Write-Note 'Logs are in the .\logs folder.'
  Write-Note 'Stop everything with:  .\run.ps1 -Stop'
  Write-Host ''
  exit 0
}

Write-Bad "Frontend did not come up. Log: $frontendLog"
Show-LogTail $frontendLog 20
try { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue } catch { }
try { Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue } catch { }
exit 1
