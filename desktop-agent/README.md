# SatyTracker78 Windows Desktop Agent

Standalone .NET 8 Windows x64 Native Messaging host. It does not require Python, pip, or pynput on the user's machine.

## Build
The Windows CI workflow publishes a self-contained single-file executable as the `satytracker78-windows-agent` artifact. Download and extract that artifact, then place `SatyTracker78.Agent.exe` beside `install-agent.bat`.

## Install
Run `install-agent.bat`, paste the current ID from `chrome://extensions`, fully restart Chrome, reload the extension, and choose Connect & enable desktop helper. The host displays a local permission prompt. Permission expires after five minutes and Stop/Chrome disconnect revokes it.

## Protocol
Chrome Native Messaging uses little-endian 32-bit length-prefixed UTF-8 JSON on stdin/stdout. Logs go to `%LOCALAPPDATA%\SatyTracker78\native-host.log`; stdout is reserved for protocol frames.

## Safety
The agent implements bounded, explicit input actions only after local approval. It does not capture screenshots, clipboard contents, passwords, keystrokes, or hidden activity; it does not spoof idle/productivity signals or bypass tracker controls. Closing the native host revokes its session.
