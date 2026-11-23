# MouseFlow AI

A local-first workspace for defining, validating and monitoring authorized browser and desktop automation.

## Included
- Vercel-hostable React + TypeScript dashboard (Vite)
- Workflow editor with browser/desktop target selection
- User-supplied locator library: CSS, XPath, ID, text, role and test ID
- Workflow JSON import/export and local run history
- Responsive overview, workflow editor, locator manager, logs, connections and settings

## Deployment boundary
Vercel hosts the static dashboard only. It does not run a user's physical mouse, desktop applications, Chrome extension scripts or persistent local agent. Real execution requires separately installed local components. Connection indicators are demonstration placeholders; toggling them does not create a real connection. A queued record is not evidence of execution.

## Requirements
Node.js 20+ and npm.

## Local development
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

## Vercel
Import SanFlash/satyenstg1. Select Vite, build command npm run build, output directory dist, install command npm install. No environment variables are required. vercel.json configures the SPA fallback.

## Persistence
Workflow definitions and history are stored in the current browser profile localStorage. They are not synced between devices. Export backups when needed.

## Planned local components
- Chrome Manifest V3 extension for active-tab locator inspection and browser execution.
- Native messaging host with strict origin and message validation.
- Separately installed desktop agent for OS-level operations.

See docs/ARCHITECTURE.md, docs/SECURITY.md and docs/DEPLOYMENT.md.
