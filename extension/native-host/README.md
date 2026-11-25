# SatyTracker78 Desktop Helper


> **GitHub-compatible motion:** the animated GIF diagrams in this guide are real GIF assets stored in `docs/assets/`. They play directly in GitHub's README viewer; no JavaScript, GSAP runtime, or external image service is required.

Created by **Satyendra Kumar Namdeo**.

The supported Windows desktop helper is now the standalone .NET agent in [desktop-agent](../../desktop-agent/README.md). The older Python/pynput installer in this directory is deprecated and should not be used for new installations.

## Install the standalone agent

<p align="center"><img src="../../docs/assets/permission.gif" alt="Animated Native Messaging setup flow" width="100%"></p>

1. Open [GitHub Actions](https://github.com/SanFlash/satyenstg1/actions).
2. Open the latest successful **CI** run on `main`.
3. Download and extract the `satytracker78-windows-agent` artifact.
4. Run `install-agent.bat` from the extracted folder and paste the current ID from `chrome://extensions`.
5. Fully exit Chrome, reopen it, reload SatyTracker78, and connect the desktop helper.
6. Approve the local permission prompt only when you intend to run authorized actions.

Logs: `%LOCALAPPDATA%\SatyTracker78\native-host.log`.

The Windows agent is currently the first replacement milestone. Browser DOM recording/replay remains separate from OS-level input. Tracker-specific API connectors are being developed as separately permissioned, read-only integrations; they do not alter, suppress, or simulate the trackers' own monitoring.


## Animated Native Messaging and permission flow

<p align="center"><img src="../../docs/assets/permission.gif" alt="Animated desktop permission lifecycle" width="100%"></p>

<p align="center"><img src="../../docs/assets/permission.gif" alt="Animated security boundaries" width="100%"></p>

The visual sequence documents the separate Native Messaging connection and explicit local permission boundary. It does not imply that browser DOM replay is routed through trusted operating-system input. The legacy Python host in this folder is deprecated; use the standalone .NET helper described in [desktop-agent](../../desktop-agent/README.md).

Explore the [GSAP interactive guide](../../docs/interactive-guide/index.html) or return to the [root README](../../README.md).
