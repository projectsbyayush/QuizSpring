@echo off
REM Double-click this file to start QuizSpring.
REM It re-launches itself in PowerShell so the real script can run.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" %*
echo.
pause
