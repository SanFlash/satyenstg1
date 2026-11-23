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

The extension now keeps the native messaging connection in the single Manifest V3 background service worker. The popup is only a control surface; closing it no longer immediately destroys the connection. The host explicitly switches Windows stdin/stdout to binary mode (required for length-prefixed Native Messaging frames) and writes startup/runtime failures to a log instead of hiding the reason. The repair installer prefers the Python Launcher over stale PATH aliases, creates an isolated Python virtual environment under `%LOCALAPPDATA%\\SatyTracker78\\venv`, installs `pynput` there, validates `tkinter`, and runs a real framed `status` request against the host before it writes the Chrome registration. The same protocol smoke test runs in CI. This catches host launch and stdout-framing problems before Chrome is involved. The background worker also times out a missing status handshake after ten seconds; the timeout stops once the host answers, so the local permission prompt can remain open while you decide.

## Remove

Double-click **`uninstall-easy.bat`** and restart Chrome.

## Scope and safety

Supported native actions: move to screen coordinates, left click, type up to 500 characters, press a small allowlisted key set, and scroll within bounded deltas. The single background service worker owns browser workflow state and the one optional native-host connection. The popup is only a user interface for that controller. This milestone establishes the native connection and bounded desktop-action message channel; existing browser recording/replay remains browser-DOM based and is not silently redirected to OS input. Desktop action execution is still a separate explicitly authorized capability, not yet a replacement for browser replay.

No background activity simulation, idle spoofing, hidden interaction, screenshot capture, clipboard access, keylogging, or monitoring-evasion features are included. Do not approve desktop control on sensitive screens. macOS Accessibility and Linux input-permission installers are not included in this Windows-first release.
