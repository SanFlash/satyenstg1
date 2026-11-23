# SatyTracker78

A local-first workflow recording and replay product for explicitly authorized browser automation, with a standalone permission-gated Windows desktop agent.

## Windows desktop agent
The supported desktop helper is a self-contained .NET 8 Windows x64 executable. It does not require Python, pip, or pynput. The Windows CI job builds and smoke-tests the Native Messaging protocol, then publishes a source-only `satytracker78-windows-agent-source` artifact (no precompiled EXE). Download it from the latest successful GitHub Actions run, extract it, and run `build-and-install.bat`. A local .NET 8 SDK build produces the executable on your PC. See [desktop-agent/README.md](desktop-agent/README.md).

The previous Python native host remains in the repository for historical compatibility, but its installer is deprecated. Use the standalone .NET agent for new installations.

## Tracker integrations
The planned provider layer is for transparent, user-authorized API access and reporting—not monitoring evasion or activity simulation. See [docs/tracker-integrations.md](docs/tracker-integrations.md) for provider API availability, account prerequisites, and current implementation status. A provider is not described as connected until its official authentication flow and a real API request have been tested.

## Browser extension — Record & Repeat
A Manifest V3 extension is included in `extension/`. Load that folder through `chrome://extensions` → Developer mode → Load unpacked. The extension records supported browser DOM interactions and repeats them until the user stops the loop. It records interaction steps, not a screen-video file. See [extension/README.md](extension/README.md).

## Dashboard and development
- Vite + React + TypeScript dashboard, deployable as a static SPA on Vercel.
- Defensive workflow import validation and local storage handling.
- Dashboard execution remains safely blocked until a real authenticated execution adapter is connected; queued records are never represented as successful runs.

```bash
npm install
npm run dev
npm run build
npm test
npm run test:e2e
```

## Safety
All desktop actions require explicit local permission and expire after five minutes. Stop or closing Chrome revokes the session. No screenshot capture, clipboard access, keylogging, hidden activity simulation, idle spoofing, or monitoring-evasion features are included. API connectors use only provider-authorized scopes and account permissions.

## Creator
Created by **Satyendra Kumar Namdeo**.

Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved.
