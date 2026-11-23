# SatyTracker78 Native Desktop Helper

Created by **Satyendra Kumar Namdeo**.

Windows-first Chrome Native Messaging companion. It requests local permission before sending visible mouse/keyboard input. Permission expires after five minutes and can be revoked with Stop or by closing Chrome.

## Easy installation (no manual PowerShell commands)
1. Open `chrome://extensions`, enable Developer mode, and copy the ID shown under SatyTracker78.
2. In this folder, double-click **`install-easy.bat`**.
3. Paste the extension ID when asked. The installer installs the Python dependency and registers the local helper automatically.
4. Restart Chrome, reload SatyTracker78, open its popup and click **Enable desktop helper**.
5. Approve the local Windows permission dialog when it appears.

If Python is missing, the installer opens the official Python download page. Install Python 3.10+ and select **Add Python to PATH**, then run the installer again.

To remove the helper, double-click **`uninstall-easy.bat`**. The older PowerShell installers remain available for advanced/manual setup.

## Supported native actions
Move to screen coordinates, left click, type up to 500 characters, press a small allowlisted key set, and scroll within bounded deltas. This first milestone adds the permission-gated native host and UI pairing control; the existing browser recording/replay remains intact and is not silently redirected to OS input.

No background activity simulation, idle spoofing, hidden interaction, screenshot capture, clipboard access, keylogging, or monitoring-evasion features are included. Do not approve desktop control on sensitive screens. macOS Accessibility and Linux input-permission installers are not included in this Windows-first release.
