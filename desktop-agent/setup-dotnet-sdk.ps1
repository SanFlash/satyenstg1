param(
    [Parameter(Mandatory=$true)]
    [string]$InstallDir
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

try {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    $installer = Join-Path $env:TEMP 'satytracker78-dotnet-install.ps1'
    $uri = 'https://dot.net/v1/dotnet-install.ps1'

    Write-Host 'Downloading the official Microsoft .NET installer...'
    Invoke-WebRequest -Uri $uri -OutFile $installer -UseBasicParsing -TimeoutSec 45

    if (!(Test-Path $installer) -or (Get-Item $installer).Length -lt 10000) {
        throw 'The official .NET installer download is missing or incomplete.'
    }

    Write-Host 'Installing .NET 8 SDK for the current Windows user (no administrator installation)...'
    $log = Join-Path $env:TEMP 'satytracker78-dotnet-install.log'
    $errLog = $log + '.err'
    $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $installer + '" -Channel 8.0 -InstallDir "' + $InstallDir + '" -NoPath'
    $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -PassThru -Wait:$false -RedirectStandardOutput $log -RedirectStandardError $errLog
    if (!$process.WaitForExit(600000)) { try { $process.Kill($true) } catch {}; throw 'The .NET SDK installer exceeded 10 minutes and was stopped. Check network access and Windows security policy.' }
    if ($process.ExitCode -ne 0) {
        throw ".NET SDK installer exited with code $($process.ExitCode). See $log and $errLog."
    }

    $dotnet = Join-Path $InstallDir 'dotnet.exe'
    if (!(Test-Path $dotnet)) { throw 'dotnet.exe was not created in the user-local SDK folder.' }

    $sdks = & $dotnet --list-sdks
    if ($LASTEXITCODE -ne 0 -or !($sdks | Where-Object { $_ -match '^8\.' })) {
        throw 'The user-local installation did not report a .NET 8 SDK.'
    }

    Write-Host 'Verified .NET SDK installation:'
    $sdks | Write-Host
    exit 0
}
catch {
    Write-Error $_
    exit 1
}
