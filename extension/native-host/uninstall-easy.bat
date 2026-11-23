@echo off
title Remove SatyTracker78 Desktop Helper
echo.
echo This removes the local desktop helper registration and files.
choice /m "Continue"
if errorlevel 2 exit /b 0
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop" /f >nul 2>&1
rmdir /s /q "%LOCALAPPDATA%\SatyTracker78" >nul 2>&1
echo.
echo SatyTracker78 Desktop Helper has been removed.
echo Restart Chrome to finish.
pause
