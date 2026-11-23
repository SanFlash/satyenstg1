# MouseFlow AI Chrome extension

## Install / update
1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this repository's `extension` folder.
3. Click **Reload** on MouseFlow AI and refresh the target website.

## Use
1. Open a normal `http://` or `https://` website.
2. Open the MouseFlow AI toolbar popup and click **Start recording**.
3. Perform the task, reopen the popup and click **Finish recording**.
4. Choose **Flow speed** to set the delay between actions and **Delay between loops** to set the pause between complete cycles.
5. Click **Start repeating flow**. Replay continues until you reopen the popup and click **Stop replay**.

## Background operation and input model
All controls live in the extension popup. During replay, a small arrow cursor is animated inside the webpage with eased, curved movement, a short target pause and click ripple feedback. No floating control panel, Chrome debugger attachment or debugger permission is used, so Chrome's "started debugging this browser" banner is not triggered.

New recordings save visible text, accessible role, labels, attributes, nearby text context and normalized position in addition to a best-effort selector. Replay tries the selector, then semantic/context matching, then a position fallback.

Clicks use synthetic page-level pointer and mouse events coordinated with the animated page cursor. These avoid the debugger banner but are **not trusted hardware input** and do not move the operating-system cursor. Some websites may reject synthetic events or require trusted physical input; a native desktop helper would be needed for that. Protected pages, canvas interfaces and cross-origin frames need specialized support.

The extension records DOM actions, not a screen video. Password, file-upload, payment-card and one-time-code fields are excluded. Use only on sites you are authorized to operate. Do not automate purchases, bulk messaging, destructive actions, CAPTCHA or access-control bypasses.
