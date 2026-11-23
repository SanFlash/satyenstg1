# MouseFlow AI Chrome extension

## Install
1. Open chrome://extensions in Chrome.
2. Enable Developer mode.
3. Click Load unpacked and select this repository's extension folder.
4. Pin MouseFlow AI — Record & Repeat.

## Default flow
1. Open a site you are authorized to operate.
2. Click Start recording and perform the task once.
3. Click Finish recording.
4. Click Start repeating flow. It loops continuously until Stop replay is pressed.

The extension records supported DOM actions (clicks, non-sensitive input, selections and scrolling), not a screen-video file. A video is visual evidence; replay requires structured interaction events. Password, file-upload, payment-card and one-time-code fields are excluded. The flow stays in local Chrome storage; no remote service is used.

## Limits and safety
Use only on sites/accounts you are authorized to operate. Chrome internal pages, extension stores, protected pages, some embedded frames, canvas interfaces and highly dynamic apps may not work. Replays are best-effort and should be watched during the first run. Avoid unattended loops that submit purchases, send messages, delete data or otherwise create irreversible effects. The user must stop the loop manually.