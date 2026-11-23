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
if not "%EXT_ID:~32,1%"=="" goto :badid
if "%EXT_ID:~31,1%"=="" goto :badid
echo %EXT_ID%| findstr /r /x "[a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p]" >nul
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
echo Installing the required desktop input component...
"%PYTHON_EXE%" -m pip install --user pynput
if errorlevel 1 goto :failed
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
