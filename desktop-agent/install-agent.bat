@echo off
setlocal EnableExtensions
title SatyTracker78 Windows Agent Installer
cd /d "%~dp0"
echo SatyTracker78 standalone Windows agent installer
echo Created by Satyendra Kumar Namdeo
if not exist "%~dp0SatyTracker78.Agent.exe" (
 echo ERROR: SatyTracker78.Agent.exe is missing.
 echo Download and extract the satytracker78-windows-agent CI artifact into this folder first.
 pause
 exit /b 1
)
set /p EXT_ID=Paste the current extension ID from chrome://extensions:
powershell -NoProfile -Command "if ($env:EXT_ID -notmatch '^[a-p]{32}$') { exit 1 }"
if errorlevel 1 (echo Invalid extension ID.& pause& exit /b 1)
set "INSTALL_DIR=%LOCALAPPDATA%\SatyTracker78"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
copy /y "%~dp0SatyTracker78.Agent.exe" "%INSTALL_DIR%\SatyTracker78.Agent.exe" >nul
if errorlevel 1 (echo Could not copy agent.& pause& exit /b 1)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$m=@{name='com.satytracker78.desktop';description='SatyTracker78 permission-gated Windows desktop agent';path=(Join-Path $env:LOCALAPPDATA 'SatyTracker78\SatyTracker78.Agent.exe');type='stdio';allowed_origins=@('chrome-extension://'+$env:EXT_ID+'/')}; $p=Join-Path $env:LOCALAPPDATA 'SatyTracker78\com.satytracker78.desktop.json'; [IO.File]::WriteAllText($p,($m|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false)); $j=Get-Content -Raw $p|ConvertFrom-Json; if (!(Test-Path $j.path) -or $j.allowed_origins[0] -ne ('chrome-extension://'+$env:EXT_ID+'/')) { throw 'Manifest validation failed' }"
if errorlevel 1 (echo Manifest creation failed.& pause& exit /b 1)
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop" /ve /t REG_SZ /d "%INSTALL_DIR%\com.satytracker78.desktop.json" /f >nul
if errorlevel 1 (echo Chrome registration failed.& pause& exit /b 1)
echo.
echo SUCCESS. Fully exit and reopen Chrome, reload SatyTracker78, then connect the desktop helper.
echo Log: %INSTALL_DIR%\native-host.log
pause
