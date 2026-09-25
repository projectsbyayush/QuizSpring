# Starts the full QuizSpring stack locally (backend API + Vite frontend).
# Run from PowerShell: powershell -ExecutionPolicy Bypass -File ./start-local.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$backend = Join-Path $root 'backend'
$jar = Join-Path $backend 'target\quiz-platform-api-0.1.0.jar'
if (-not (Test-Path $jar)) {
  Write-Error "Backend jar not found. Build it first: cd backend; mvn package -DskipTests"
  exit 1
}

Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$backend'; java -jar target\quiz-platform-api-0.1.0.jar --spring.profiles.active=dev"
$node = Join-Path ${env:ProgramFiles} 'nodejs\node.exe'
$vite = Join-Path $root 'node_modules\vite\bin\vite.js'
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root'; & '$node' '$vite'"

Write-Host ''
Write-Host 'QuizSpring is starting…'
Write-Host '  Backend:  http://localhost:8080/actuator/health'
Write-Host '  Frontend: http://localhost:5173'
Write-Host 'Close the two new windows to stop the servers.'
