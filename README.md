# MouseFlow AI

A local-first workflow design and monitoring workspace for explicitly authorized browser/desktop automation.

## Reliability and deployment
- Vite + React + TypeScript dashboard, deployable as a static SPA on Vercel.
- Defensive workflow import validation: JSON syntax, field types, allowed actions, locator strategies, unique step IDs, bounds and size limits.
- Local storage access guarded against unavailable storage, malformed JSON and quota/security exceptions.
- Execution is safely blocked until a real authenticated local adapter is installed; a queued dashboard record is never represented as a successful run.
- Browser profile data remains local. Export workspace backups before clearing browser data.

## Chrome extension — Record & Repeat

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
