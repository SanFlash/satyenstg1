$ErrorActionPreference = 'Stop'
$hostName = 'com.satytracker78.desktop'
$registryPath = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\' + $hostName
$installDir = Join-Path $env:LOCALAPPDATA 'SatyTracker78'
if (Test-Path $registryPath) {
    Remove-Item -LiteralPath $registryPath -Force
}
if (Test-Path $installDir) {
    Remove-Item -LiteralPath $installDir -Recurse -Force
}
Write-Host 'SatyTracker78 Desktop Helper and its Chrome registration have been removed.' -ForegroundColor Green
