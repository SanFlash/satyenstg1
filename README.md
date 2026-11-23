# SatyTracker78

A local-first workflow recording and replay product for explicitly authorized browser automation, with an optional permission-gated Windows desktop helper.

## Reliability and deployment
- Vite + React + TypeScript dashboard, deployable as a static SPA on Vercel.
- Defensive workflow import validation: JSON syntax, field types, allowed actions, locator strategies, unique step IDs, bounds and size limits.
- Local storage access guarded against unavailable storage, malformed JSON and quota/security exceptions.
- Execution in the dashboard remains safely blocked until a real authenticated local adapter is installed; a queued dashboard record is never represented as a successful run.
- Browser profile data remains local. Export workspace backups before clearing browser data.

## Single-worker execution architecture\n\nThe Manifest V3 `background.js` service worker is the single orchestration point for browser workflow state and the optional native desktop-helper connection. The popup is a control surface only; it does not own a separate native connection. Browser tabs/content scripts act as page adapters, while the Windows Native Messaging host is an optional OS-input adapter. This avoids creating a separate orchestration worker for each website or tab.\n\nThe native helper connection is permission-gated and is not silently substituted for DOM replay. Full dashboard-to-local-agent pairing and automatic conversion of browser recordings into OS-level input are not yet implemented.\n\n## Chrome extension — Record & Repeat

A Manifest V3 extension is included in `extension/`. Load that folder through `chrome://extensions` → Developer mode → Load unpacked. The default flow records supported browser DOM interactions once and repeats them until the user stops the loop. The extension also injects a floating control panel into the active webpage so recording and stopping are visible on-page. It records interaction steps, not a screen-video file. See [extension/README.md](extension/README.md) for setup, supported actions and limitations.

## Commands
```bash
npm install
npm run dev
npm run build
npm test
npm run test:e2e
```

## Vercel
Framework Vite; install `npm install`; build `npm run build`; output `dist`. No environment variables are required. SPA rewrite is configured in vercel.json.

## Execution boundary
A Vercel static site cannot control a user's OS pointer, keyboard or local browser session. Production execution requires a separately installed extension/desktop agent, secure pairing, origin allowlists, validated messages, cancellation semantics and an independent emergency stop. Connection controls are currently explicit demo placeholders, not live pairings.


## Creator
Created by **Satyendra Kumar Namdeo**.


Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved.
