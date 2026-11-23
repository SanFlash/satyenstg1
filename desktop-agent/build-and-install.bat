@echo off
setlocal EnableExtensions
title SatyTracker78 - Build and Install Windows Agent
cd /d "%~dp0"
echo ==========================================
echo SatyTracker78 - Local source build
echo Created by Satyendra Kumar Namdeo
echo ==========================================

set "SDK_DIR=%LOCALAPPDATA%\SatyTracker78\dotnet-sdk"
set "DOTNET_ROOT=%SDK_DIR%"
set "PATH=%SDK_DIR%;%PATH%"

if exist "%SDK_DIR%\dotnet.exe" (
  "%SDK_DIR%\dotnet.exe" --list-sdks | findstr /b "8." >nul
  if not errorlevel 1 goto BUILD_AGENT
)

where dotnet >nul 2>&1
if not errorlevel 1 (
  for /f "tokens=*" %%V in ('dotnet --list-sdks 2^>nul ^| findstr /b "8."') do (
    echo Found installed .NET 8 SDK: %%V
    goto BUILD_AGENT
  )
)

echo .NET 8 SDK not found. Installing a private copy for this Windows user...
echo Destination: %SDK_DIR%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-dotnet-sdk.ps1" -InstallDir "%SDK_DIR%"
if errorlevel 1 (
  echo.
  echo SDK installation failed. Check internet access and Windows security policy.
  echo No administrator-level policy or security control has been changed.
  pause
  exit /b 1
)
set "DOTNET_ROOT=%SDK_DIR%"
set "PATH=%SDK_DIR%;%PATH%"

:BUILD_AGENT
echo.
echo Checking .NET SDK...
"%DOTNET_ROOT%\dotnet.exe" --list-sdks
if errorlevel 1 (
  echo .NET SDK validation failed.
  pause
  exit /b 1
)
"%DOTNET_ROOT%\dotnet.exe" publish "%~dp0SatyTracker78.Agent.csproj" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o "%~dp0build"
if errorlevel 1 (
  echo.
  echo Build failed. Review the compiler output above.
  pause
  exit /b 1
)
if not exist "%~dp0build\SatyTracker78.Agent.exe" (
  echo Build completed but the expected executable was not produced.
  pause
  exit /b 1
)
copy /y "%~dp0build\SatyTracker78.Agent.exe" "%~dp0SatyTracker78.Agent.exe" >nul
if errorlevel 1 (
  echo Could not stage the compiled agent.
  pause
  exit /b 1
)
echo.
echo Build completed. Starting the installer...
call "%~dp0install-agent.bat"
