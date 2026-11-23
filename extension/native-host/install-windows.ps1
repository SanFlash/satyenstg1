param([Parameter(Mandatory=$true)][string]$ExtensionId,[string]$Python="python")
$ErrorActionPreference="Stop"
if($ExtensionId -notmatch '^[a-p]{32}$'){throw "Use the 32-character ID shown at chrome://extensions"}
$Root=Split-Path -Parent $MyInvocation.MyCommand.Path
$Dir=Join-Path $env:LOCALAPPDATA "SatyTracker78";New-Item -ItemType Directory -Force -Path $Dir|Out-Null
Copy-Item (Join-Path $Root "host.py") (Join-Path $Dir "host.py") -Force
& $Python -m pip install --user pynput
if($LASTEXITCODE -ne 0){throw "pynput install failed"}
$Exe=(Get-Command $Python).Source
$Json=@{name="com.satytracker78.desktop";description="SatyTracker78 permission-gated desktop input";path=$Exe;type="stdio";allowed_origins=@("chrome-extension://$ExtensionId/")}|ConvertTo-Json -Depth 4
$Path=Join-Path $Dir "com.satytracker78.desktop.json";Set-Content $Path $Json -Encoding UTF8
$Key="HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.satytracker78.desktop";New-Item $Key -Force|Out-Null;Set-ItemProperty $Key "(default)" $Path
Write-Host "Installed. Restart Chrome and reload SatyTracker78."
