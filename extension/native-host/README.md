# SatyTracker78 Desktop Helper

Created by **Satyendra Kumar Namdeo**.

The supported Windows desktop helper is now the standalone .NET agent in [desktop-agent](../../desktop-agent/README.md). The older Python/pynput installer in this directory is deprecated and should not be used for new installations.

## Install the standalone agent
1. Open [GitHub Actions](https://github.com/SanFlash/satyenstg1/actions).
2. Open the latest successful **CI** run on `main`.
3. Download and extract the `satytracker78-windows-agent` artifact.
4. Run `install-agent.bat` from the extracted folder and paste the current ID from `chrome://extensions`.
5. Fully exit Chrome, reopen it, reload SatyTracker78, and connect the desktop helper.
6. Approve the local permission prompt only when you intend to run authorized actions.

Logs: `%LOCALAPPDATA%\SatyTracker78\native-host.log`.

The Windows agent is currently the first replacement milestone. Browser DOM recording/replay remains separate from OS-level input. Tracker-specific API connectors are being developed as separately permissioned, read-only integrations; they do not alter, suppress, or simulate the trackers' own monitoring.
