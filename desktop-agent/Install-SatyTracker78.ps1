$ErrorActionPreference = 'Stop'
$hostName = 'com.satytracker78.desktop'
$extensionIdPattern = '^[a-p]{32}$'
$installDir = Join-Path $env:LOCALAPPDATA 'SatyTracker78'
$sourceExe = Join-Path $PSScriptRoot 'SatyTracker78.Agent.exe'
$targetExe = Join-Path $installDir 'SatyTracker78.Agent.exe'
$manifestPath = Join-Path $installDir ($hostName + '.json')
$registryPath = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\' + $hostName

Write-Host ''
Write-Host 'SatyTracker78 Desktop Helper installer' -ForegroundColor Cyan
Write-Host 'This installs the signed-off local helper for the current Windows user.'
Write-Host 'No administrator access or separate .NET installation is required.'
Write-Host ''

if (-not (Test-Path -LiteralPath $sourceExe -PathType Leaf)) {
    throw "Installer package is incomplete. Missing $sourceExe"
}

$extensionId = Read-Host 'Enter the SatyTracker78 extension ID from chrome://extensions'
$extensionId = $extensionId.Trim()
if ($extensionId -notmatch $extensionIdPattern) {
    throw 'Invalid Chrome extension ID. It must contain exactly 32 characters from a through p.'
}

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Copy-Item -LiteralPath $sourceExe -Destination $targetExe -Force
if (-not (Test-Path -LiteralPath $targetExe -PathType Leaf)) {
    throw 'Could not install the desktop helper executable.'
}

$manifest = [ordered]@{
    name = $hostName
    description = 'SatyTracker78 permission-gated Windows desktop agent'
    path = $targetExe
    type = 'stdio'
    allowed_origins = @("chrome-extension://$extensionId/")
}
$json = $manifest | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($manifestPath, $json, [System.Text.UTF8Encoding]::new($false))

$parsed = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($parsed.name -ne $hostName -or $parsed.type -ne 'stdio' -or
    $parsed.path -ne $targetExe -or
    $parsed.allowed_origins.Count -ne 1 -or
    $parsed.allowed_origins[0] -ne "chrome-extension://$extensionId/" -or
    -not (Test-Path -LiteralPath $parsed.path -PathType Leaf)) {
    throw 'Native messaging manifest validation failed. Registration was not changed.'
}

New-Item -Path $registryPath -Force | Out-Null
Set-Item -Path $registryPath -Value $manifestPath
$registeredManifest = (Get-Item -LiteralPath $registryPath).GetValue('')
if ($registeredManifest -ne $manifestPath -or -not (Test-Path -LiteralPath $registeredManifest -PathType Leaf)) {
    throw 'Chrome native messaging registration verification failed.'
}

Write-Host ''
Write-Host 'INSTALLATION SUCCESSFUL' -ForegroundColor Green
Write-Host "Desktop helper: $targetExe"
Write-Host "Native host manifest: $manifestPath"
Write-Host "Chrome registration: $registryPath"
Write-Host "Allowed extension: chrome-extension://$extensionId/"
Write-Host ''
Write-Host 'Next: fully exit Chrome, reopen it, reload SatyTracker78, and click Connect & enable desktop helper.'
