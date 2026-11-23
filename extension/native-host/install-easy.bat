@echo off
setlocal EnableExtensions
title SatyTracker78 - Desktop Helper Repair
cd /d "%~dp0"
echo.
echo  ==========================================
echo       SatyTracker78 Desktop Helper Setup
echo       Created by Satyendra Kumar Namdeo
echo  ==========================================
echo.
set /p EXT_ID=Paste the current SatyTracker78 Extension ID from chrome://extensions:
if "%EXT_ID%"=="" goto :badid
powershell -NoProfile -Command "if ($env:EXT_ID -notmatch '^[a-p]{32}$') { exit 1 }"
if errorlevel 1 goto :badid

rem Prefer the Python Launcher; it avoids stale Windows Store aliases from PATH.
set "BASE_PYTHON="
for /f "delims=" %%P in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do if not defined BASE_PYTHON set "BASE_PYTHON=%%P"
if not defined BASE_PYTHON for /f "delims=" %%P in ('where python 2^>nul') do if not defined BASE_PYTHON set "BASE_PYTHON=%%P"
if not defined BASE_PYTHON (
  echo Python 3 was not found. Opening the official Python download page...
  start "" "https://www.python.org/downloads/windows/"
  echo Install Python 3.10+ with the Tcl/Tk option enabled, then run this installer again.
  pause
  exit /b 1
)

set "INSTALL_DIR=%LOCALAPPDATA%\SatyTracker78"
set "VENV_DIR=%INSTALL_DIR%\venv"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo.
echo Creating an isolated Python environment...
"%BASE_PYTHON%" -m venv "%VENV_DIR%"
if errorlevel 1 goto :venvfailed
set "PYTHON_EXE=%VENV_DIR%\Scripts\python.exe"
if not exist "%PYTHON_EXE%" goto :venvfailed
copy /y "%~dp0host.py" "%INSTALL_DIR%\host.py" >nul
if errorlevel 1 goto :failed
copy /y "%~dp0verify-host.py" "%INSTALL_DIR%\verify-host.py" >nul
if errorlevel 1 goto :failed

echo.
echo Installing desktop input dependency into the isolated environment...
"%PYTHON_EXE%" -m pip install --disable-pip-version-check --upgrade pip pynput
if errorlevel 1 goto :pipfailed
"%PYTHON_EXE%" -c "import tkinter,pynput; print('Python desktop dependencies: OK')"
if errorlevel 1 goto :runtimefailed

echo.
echo Verifying that the native host starts and speaks Chrome's framing protocol...
"%PYTHON_EXE%" "%INSTALL_DIR%\verify-host.py" "%INSTALL_DIR%\host.py"
if errorlevel 1 goto :protocolfailed

echo.
echo Registering the verified helper with Chrome...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$m=@{name='com.satytracker78.desktop';description='SatyTracker78 permission-gated desktop input';path=$env:PYTHON_EXE;args=@((Join-Path $env:LOCALAPPDATA 'SatyTracker78\host.py'));type='stdio';allowed_origins=@('chrome-extension://'+$env:EXT_ID+'/')}; $p=Join-Path $env:LOCALAPPDATA 'SatyTracker78\com.satytracker78.desktop.json'; [IO.File]::WriteAllText($p,($m|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false)); $j=Get-Content -Raw $p|ConvertFrom-Json; if ($j.name -ne 'com.satytracker78.desktop' -or $j.type -ne 'stdio' -or -not (Test-Path $j.path) -or -not (Test-Path $j.args[0])) { throw 'Native host manifest validation failed' }"
if errorlevel 1 goto :failed
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop" /ve /t REG_SZ /d "%INSTALL_DIR%\com.satytracker78.desktop.json" /f >nul
if errorlevel 1 goto :failed
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop" /ve
if errorlevel 1 goto :failed

echo.
echo  SUCCESS - helper installed and protocol self-test passed.
echo  1. Fully exit Chrome (all windows), then reopen it.
echo  2. Open chrome://extensions and reload SatyTracker78.
echo  3. Click Enable desktop helper and approve the Windows prompt.
echo.
echo  Log: %INSTALL_DIR%\native-host.log
pause
exit /b 0

:badid
echo Invalid extension ID. Copy the 32-character ID shown under SatyTracker78.
pause
exit /b 1
:venvfailed
echo Could not create a Python virtual environment. Install Python 3.10+ from python.org with Tcl/Tk enabled.
pause
exit /b 1
:pipfailed
echo Could not install pynput. Check internet access and rerun this repair installer.
pause
exit /b 1
:runtimefailed
echo tkinter or pynput is unavailable in this Python installation. Reinstall Python with Tcl/Tk support.
pause
exit /b 1
:protocolfailed
echo The native host failed its startup/protocol self-test. See native-host.log for details.
pause
exit /b 1
:failed
echo Setup failed before registration completed. See the error above and rerun this installer.
pause
exit /b 1
