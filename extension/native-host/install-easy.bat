@echo off
setlocal EnableExtensions
title SatyTracker78 - Easy Desktop Helper Setup
cd /d "%~dp0"
echo.
echo  ==========================================
echo       SatyTracker78 Desktop Helper
echo       Created by Satyendra Kumar Namdeo
echo  ==========================================
echo.
set /p EXT_ID=Paste your SatyTracker78 Extension ID from chrome://extensions:
if "%EXT_ID%"=="" goto :badid
rem Validate Chrome's 32-character extension ID without FINDSTR's command-length limit.
powershell -NoProfile -Command "if ($env:EXT_ID -notmatch '^[a-p]{32}$') { exit 1 }"
if errorlevel 1 goto :badid
set "PYTHON_EXE="
for /f "delims=" %%P in ('where python 2^>nul') do if not defined PYTHON_EXE set "PYTHON_EXE=%%P"
if not defined PYTHON_EXE (
  echo Python was not found. Opening the official Python download page...
  start "" "https://www.python.org/downloads/windows/"
  echo Install Python and select "Add Python to PATH", then run this installer again.
  pause
  exit /b 1
)
set "INSTALL_DIR=%LOCALAPPDATA%\SatyTracker78"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
copy /y "%~dp0host.py" "%INSTALL_DIR%\host.py" >nul
if errorlevel 1 goto :failed
echo.
echo Checking Python package installer...
"%PYTHON_EXE%" -m pip --version >nul 2>&1
if not errorlevel 1 goto :install_dependency

echo pip is missing. Trying Python's built-in ensurepip...
"%PYTHON_EXE%" -m ensurepip --upgrade
"%PYTHON_EXE%" -m pip --version >nul 2>&1
if not errorlevel 1 goto :install_dependency

echo ensurepip is unavailable. Downloading the official pip bootstrap...
set "GETPIP=%TEMP%\satytracker78-get-pip.py"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing 'https://bootstrap.pypa.io/get-pip.py' -OutFile $env:GETPIP; exit 0 } catch { Write-Host $_; exit 1 }"
if errorlevel 1 goto :pipfailed
"%PYTHON_EXE%" "%GETPIP%" --user
if errorlevel 1 goto :pipfailed
del "%GETPIP%" >nul 2>&1

:install_dependency
echo.
echo Installing the required desktop input component...
"%PYTHON_EXE%" -m pip install --user --upgrade pynput
if errorlevel 1 goto :failed
"%PYTHON_EXE%" -c "import tkinter,pynput; print('Python desktop dependencies: OK')"
if errorlevel 1 goto :runtimefailed
echo.
echo Registering SatyTracker78 with Chrome...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$m=@{name='com.satytracker78.desktop';description='SatyTracker78 permission-gated desktop input';path=$env:PYTHON_EXE;args=@((Join-Path $env:LOCALAPPDATA 'SatyTracker78\host.py'));type='stdio';allowed_origins=@('chrome-extension://'+$env:EXT_ID+'/')}; [IO.File]::WriteAllText((Join-Path $env:LOCALAPPDATA 'SatyTracker78\com.satytracker78.desktop.json'),($m|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))"
if errorlevel 1 goto :failed
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop" /ve /t REG_SZ /d "%INSTALL_DIR%\com.satytracker78.desktop.json" /f >nul
if errorlevel 1 goto :failed
echo.
echo  SUCCESS! SatyTracker78 Desktop Helper is installed.
echo  1. Restart Chrome.
echo  2. Open chrome://extensions and reload SatyTracker78.
echo  3. Open the extension and click Enable desktop helper.
echo.
echo  You will be asked for local permission before desktop input is enabled.
pause
exit /b 0
:runtimefailed
echo.
echo Python was found, but tkinter or pynput cannot be imported.
echo Repair or reinstall Python 3.10+ with Tcl/Tk support enabled, then run this installer again.
pause
exit /b 1
:pipfailed
echo.
echo Could not install pip automatically. Check your internet connection and Python installation.
echo You can install Python from https://www.python.org/downloads/windows/ and select Add Python to PATH.
pause
exit /b 1
:badid
echo.
echo Invalid extension ID. Copy the 32-character ID shown under SatyTracker78 at chrome://extensions.
pause
exit /b 1
:failed
echo.
echo Setup did not finish. Check that Python is installed and try again.
pause
exit /b 1
