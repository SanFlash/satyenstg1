$ErrorActionPreference = 'Continue'
$root = Join-Path $env:LOCALAPPDATA 'SatyTracker78'
$key = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop'
$manifest = $null
Write-Host 'SatyTracker78 Windows helper diagnostics' -ForegroundColor Cyan
Write-Host ('User-local install folder: ' + $root)
Write-Host ('Install folder exists: ' + (Test-Path $root))
if (Test-Path $key) {
    $manifest = (Get-ItemProperty -Path $key -ErrorAction SilentlyContinue).'(default)'
    Write-Host ('Chrome registry entry: ' + $key)
    Write-Host ('Registered manifest: ' + $manifest)
} else {
    Write-Host 'Chrome registry entry: MISSING' -ForegroundColor Yellow
}
if ($manifest -and (Test-Path $manifest)) {
    try {
        $data = Get-Content -Raw $manifest | ConvertFrom-Json
        Write-Host ('Manifest name: ' + $data.name)
        Write-Host ('Host executable: ' + $data.path)
        Write-Host ('Executable exists: ' + (Test-Path $data.path))
        Write-Host ('Allowed extension origin: ' + ($data.allowed_origins -join ', '))
    } catch { Write-Host ('Manifest parse error: ' + $_) -ForegroundColor Red }
} elseif ($manifest) { Write-Host 'Registered manifest file is MISSING' -ForegroundColor Red }
$log = Join-Path $root 'native-host.log'
Write-Host ('Log file: ' + $log)
if (Test-Path $log) { Write-Host 'Last 30 log lines:'; Get-Content $log -Tail 30 } else { Write-Host 'Log file not created yet.' -ForegroundColor Yellow }
Write-Host '.NET SDKs visible on PATH:'
dotnet --list-sdks 2>&1
Write-Host 'User-local .NET SDKs:'
$localDotnet = Join-Path $root 'dotnet-sdk\dotnet.exe'
if (Test-Path $localDotnet) { & $localDotnet --list-sdks } else { Write-Host 'No user-local dotnet.exe found.' }
