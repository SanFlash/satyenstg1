@echo off
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop" /f >nul 2>&1
echo SatyTracker78 Chrome native host registration removed.
echo Installed agent files and logs remain under %%LOCALAPPDATA%%\SatyTracker78 so you can inspect or remove them manually.
pause
