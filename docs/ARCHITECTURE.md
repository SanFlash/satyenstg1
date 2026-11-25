# Architecture

<p align="center"><img src="assets/system-overview.svg" alt="Animated SatyTracker78 architecture overview" width="100%"></p>


Vercel serves the static React/Vite dashboard. The Chrome extension is installed in the user's browser. A native messaging host validates extension origin and messages. A separately installed desktop agent performs explicitly permitted OS interactions.

Browser and desktop adapters remain separate. Browser adapter validates origin, locator match count and target state. Desktop adapter is permission-scoped and has an independent emergency stop.

Execution states: draft, validated, scheduled, queued, running, paused, completed, failed and cancelled. The hosted UI currently records queue intent only; it does not execute actions.

Long-running jobs belong in the local agent or a separately deployed persistent worker, not a Vercel serverless function.
