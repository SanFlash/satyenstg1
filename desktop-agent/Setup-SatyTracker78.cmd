@echo off
setlocal
title SatyTracker78 Desktop Helper Setup
cd /d "%~dp0"
echo ==========================================
echo SatyTracker78 Desktop Helper Setup
echo Created by Satyendra Kumar Namdeo
echo ==========================================
if not exist "%~dp0SatyTracker78.Agent.exe" (
  echo ERROR: SatyTracker78.Agent.exe is missing.
  echo Download the complete Windows setup ZIP from GitHub Releases.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-SatyTracker78.ps1"
if errorlevel 1 (
  echo.
  echo Setup did not complete. Review the error above.
  pause
  exit /b 1
)
echo.
echo Setup completed. Fully restart Chrome, then open SatyTracker78.
pause
