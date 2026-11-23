# SatyTracker78 Native Desktop Helper

Created by **Satyendra Kumar Namdeo**.

Windows-first Chrome Native Messaging companion. It requests local permission before sending visible mouse/keyboard input. Permission expires after five minutes and can be revoked with Stop or by closing Chrome.

## One-time setup

1. Open `chrome://extensions`, enable Developer mode, and copy the ID shown under SatyTracker78.
2. Open this folder and double-click **`install-easy.bat`**.
3. Paste the current extension ID when asked. The installer installs the Python dependency and registers the helper.
4. Restart Chrome completely, open `chrome://extensions`, and reload SatyTracker78.
5. Open the extension and click **Connect & enable desktop helper**.
6. Approve the Windows permission dialog.

You do not need to type or run PowerShell commands. If Python is missing, the installer opens the official Python download page. Install Python 3.10+ with **Add Python to PATH**, then run the installer again.

## If connection still fails

1. Run **`diagnose.bat`** from this folder.
2. It checks the Chrome registry entry, host manifest, Python, required modules, host script, and diagnostic log.
3. If a log exists, it is at `%LOCALAPPDATA%\SatyTracker78\native-host.log`. Share the diagnostic output (you can redact your Windows username from file paths).

The extension now checks the native host connection before opening the permission prompt, and the host writes startup/runtime failures to a log instead of hiding the reason.

## Remove

Double-click **`uninstall-easy.bat`** and restart Chrome.

## Scope and safety

Supported native actions: move to screen coordinates, left click, type up to 500 characters, press a small allowlisted key set, and scroll within bounded deltas. This milestone adds the permission-gated native host and UI pairing control; existing browser recording/replay remains intact and is not silently redirected to OS input.

No background activity simulation, idle spoofing, hidden interaction, screenshot capture, clipboard access, keylogging, or monitoring-evasion features are included. Do not approve desktop control on sensitive screens. macOS Accessibility and Linux input-permission installers are not included in this Windows-first release.
