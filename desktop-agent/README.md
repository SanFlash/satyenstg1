# SatyTracker78 Windows Desktop Agent

Windows x64 Native Messaging host built from transparent .NET 8 source. The published GitHub Actions artifact intentionally contains **source code and batch scripts only**, not a precompiled executable.

## Requirements
- Windows 10/11 x64
- .NET 8 SDK (not just runtime). Download from https://dotnet.microsoft.com/download/dotnet/8.0
- Google Chrome with the SatyTracker78 extension loaded

## Install
1. Download the `satytracker78-windows-agent-source` artifact from the latest successful GitHub Actions run and extract it.
2. Inspect `Program.cs` and `SatyTracker78.Agent.csproj` if desired.
3. Double-click `build-and-install.bat`. It compiles the source on your PC, then starts `install-agent.bat`.
4. Paste the current extension ID from `chrome://extensions`.
5. Fully exit Chrome, reopen it, reload SatyTracker78, and choose Connect & enable desktop helper.
6. Approve the local permission prompt only when you intend to use desktop input.

The installer stores the executable under `%LOCALAPPDATA%\SatyTracker78` and registers the Chrome Native Messaging manifest for the exact extension ID. No Python, pip, or pynput is required.

## Protocol and diagnostics
Chrome Native Messaging uses little-endian 32-bit length-prefixed UTF-8 JSON on stdin/stdout. Logs go to `%LOCALAPPDATA%\SatyTracker78\native-host.log`; stdout is reserved for protocol frames.

## Safety
The agent implements bounded, explicit input actions only after local approval. Permission expires after five minutes and Stop/Chrome disconnect revokes it. It does not capture screenshots, clipboard contents, passwords, keystrokes, or hidden activity; it does not spoof idle/productivity signals or bypass tracker controls.

## Reproducible CI verification
The Windows CI job independently compiles the same source, runs a Native Messaging framing smoke test against the compiled executable, then publishes the source-only distribution bundle.
