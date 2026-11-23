@echo off
setlocal EnableExtensions
title SatyTracker78 - Build and Install Windows Agent
cd /d "%~dp0"
echo ==========================================
echo SatyTracker78 - Local source build
echo Created by Satyendra Kumar Namdeo
echo ==========================================
where dotnet >nul 2>&1
if errorlevel 1 (
 echo .NET 8 SDK was not found.
 echo Install the .NET 8 SDK from:
 start "" "https://dotnet.microsoft.com/download/dotnet/8.0"
 pause
 exit /b 1
)
for /f "tokens=*" %%V in ('dotnet --version') do set "DOTNET_VERSION=%%V"
echo Detected .NET SDK: %DOTNET_VERSION%
dotnet publish "%~dp0SatyTracker78.Agent.csproj" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o "%~dp0build"
if errorlevel 1 (
 echo Build failed. Review the compiler output above.
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
