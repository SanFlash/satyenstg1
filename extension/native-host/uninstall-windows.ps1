Remove-Item "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $env:LOCALAPPDATA "SatyTracker78") -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "SatyTracker78 native helper removed."
