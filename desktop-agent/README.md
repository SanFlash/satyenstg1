# SatyTracker78 Windows Desktop Helper


> **GitHub-compatible motion:** the animated GIF diagrams in this guide are real GIF assets stored in `docs/assets/`. They play directly in GitHub's README viewer; no JavaScript, GSAP runtime, or external image service is required.

End-user Windows x64 companion for the SatyTracker78 Chrome extension.

## Install (no developer tools required)

<p align="center"><img src="../docs/assets/permission.gif" alt="Animated Windows helper installation and permission flow" width="100%"></p>


1. Download and extract **SatyTracker78-Windows-Setup.zip** from the latest GitHub Release.
2. Double-click **Setup-SatyTracker78.cmd**.
3. When prompted, paste the extension ID shown at chrome://extensions.
4. The installer copies the self-contained helper into the user's LocalAppData SatyTracker78 folder, writes and validates the Native Messaging manifest, and registers it for the current Windows user.
5. Fully exit and reopen Chrome, reload SatyTracker78, and click **Connect & enable desktop helper**.
6. Approve the Windows permission dialog only when you intend to allow visible desktop input.

No separate .NET SDK, Python, pip, administrator access, or manual registry editing is required. The installer is per-user and only registers the exact extension ID entered.

## Uninstall

<p align="center"><img src="../docs/assets/permission.gif" alt="Animated helper removal and permission boundary" width="100%"></p>


Run **Uninstall-SatyTracker78.cmd** from the extracted setup folder. It removes the current user's native messaging registration and installed SatyTracker78 folder, including its local log.

## Troubleshooting

<p align="center"><img src="../docs/assets/replay.gif" alt="Animated native host troubleshooting flow" width="100%"></p>


- Confirm the extension ID pasted during setup matches the ID shown at chrome://extensions.
- Restart all Chrome processes after installation.
- Re-run Setup-SatyTracker78.cmd to repair the helper registration.
- The log is stored under LocalAppData\SatyTracker78\native-host.log.

## Security

<p align="center"><img src="../docs/assets/permission.gif" alt="Animated desktop security controls" width="100%"></p>


Desktop input is disabled until the user approves a local Windows permission dialog. Permission expires after five minutes; Stop or Chrome disconnect revokes it. The helper performs bounded, explicit input actions only. It does not capture screenshots, clipboard contents, passwords, keystrokes, hidden activity, spoof idle/productivity signals, or bypass tracker controls.

## Developer build

<p align="center"><img src="../docs/assets/dashboard.gif" alt="Animated Windows build and release flow" width="100%"></p>


The source project remains in this directory. For development, use the .NET 8 SDK and build-and-install.bat. End users should use the self-contained Windows setup ZIP instead.


## Animated desktop-helper flow

<p align="center"><img src="../docs/assets/permission.gif" alt="Animated desktop permission lifecycle" width="100%"></p>

The sequence shows the actual documented permission boundary: the helper is installed for the current Windows user, Chrome connects through Native Messaging, and desktop input remains disabled until the local Windows permission dialog is approved. Permission expires after five minutes; Stop or Chrome disconnect revokes it.

<p align="center"><img src="../docs/assets/permission.gif" alt="Animated security boundaries" width="100%"></p>

The diagrams are documentation visuals, not a live permission monitor. See the [full GSAP product guide](../docs/interactive-guide/index.html) and [repository README](../README.md) for the complete product walkthrough.
