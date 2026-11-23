@echo off
setlocal EnableExtensions
title SatyTracker78 Desktop Helper Diagnostics
set "HOSTKEY=HKCU\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop"
echo.
echo SatyTracker78 - Desktop Helper Diagnostics
echo ==========================================
echo.
echo [1] Chrome Native Messaging registration
reg query "%HOSTKEY%" /ve
if errorlevel 1 goto :missing
echo.
echo [2] Registered host manifest
for /f "tokens=2,*" %%A in ('reg query "%HOSTKEY%" /ve 2^>nul ^| find "REG_SZ"') do set "MANIFEST=%%B"
if not defined MANIFEST goto :missing
if not exist "%MANIFEST%" goto :missing
type "%MANIFEST%"
echo.
echo [3] Python and required modules
for /f "usebackq tokens=*" %%P in (`powershell -NoProfile -Command "(Get-Content -Raw $env:MANIFEST | ConvertFrom-Json).path"`) do set "PYTHON_EXE=%%P"
if not defined PYTHON_EXE goto :missing
"%PYTHON_EXE%" --version
"%PYTHON_EXE%" -c "import tkinter,pynput; print('PASS: tkinter and pynput are available')"
if errorlevel 1 echo FAIL: tkinter or pynput is missing. Run install-easy.bat again.
echo.
echo [4] Host script
if exist "%LOCALAPPDATA%\SatyTracker78\host.py" (echo PASS: host.py exists) else echo FAIL: host.py is missing.
echo.
echo [5] Host log
if exist "%LOCALAPPDATA%\SatyTracker78\native-host.log" (type "%LOCALAPPDATA%\SatyTracker78\native-host.log") else echo No host log yet. Click Connect in Chrome, then run this diagnostic again.
echo.
pause
exit /b 0
:missing
echo FAIL: Registration or host manifest is missing or unreadable.
pause
exit /b 1
