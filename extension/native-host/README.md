# SatyTracker78 Native Desktop Helper

Created by **Satyendra Kumar Namdeo**.

Windows-first Chrome Native Messaging companion. Requires explicit approval in a local consent dialog before sending visible mouse/keyboard input. Permission expires after five minutes and can be revoked with Stop or by closing Chrome.

## Install
1. Open chrome://extensions, enable Developer mode and copy the SatyTracker78 extension ID.
2. Install Python 3.10+ and ensure python is on PATH.
3. In PowerShell, run Set-ExecutionPolicy -Scope Process Bypass, then ./install-windows.ps1 -ExtensionId YOUR_EXTENSION_ID.
4. Restart Chrome and reload the extension.

Uninstall with ./uninstall-windows.ps1.

## Supported native actions
Move to screen coordinates, left click, type up to 500 characters, press a small allowlisted key set, and scroll within bounded deltas. Commands are not exposed to arbitrary shell execution. This first milestone adds the permission-gated native host and UI pairing control; existing browser recording/replay remains intact and is not silently redirected to OS input.

No background activity simulation, idle spoofing, hidden interaction, screenshot capture, clipboard access, keylogging, or monitoring-evasion features are included. Do not approve desktop control on sensitive screens. macOS Accessibility and Linux input-permission installers are not included in this Windows-first release.
