@echo off
setlocal
title SatyTracker78 Desktop Helper Uninstaller
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Uninstall-SatyTracker78.ps1"
if errorlevel 1 (
  echo Uninstall did not complete.
  pause
  exit /b 1
)
pause
