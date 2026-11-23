# MouseFlow AI Chrome extension

## Install / update
1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this repository's `extension` folder.
3. Approve the Chrome debugger permission when prompted. This is used for browser-level mouse input.
4. After pulling an update, click **Reload** on the extension card and refresh the target website.

## Use
1. Open a normal `http://` or `https://` website.
2. Open the MouseFlow AI toolbar popup and click **Start recording**.
3. Perform the task, reopen the popup and click **Finish recording**.
4. Click **Start repeating flow**. Replay continues in the background service worker until you reopen the popup and click **Stop replay**.

## Background operation and mouse input
The tracker no longer injects a floating panel or a purple pointer into the webpage. All controls live in the extension popup, so the page remains unobstructed.

New recordings save visible text, accessible role, labels, attributes, nearby text context and normalized position in addition to a best-effort selector. Replay tries the selector, then semantic/context matching, then a position fallback.

Clicks are sent through Chrome DevTools Protocol browser input (`Input.dispatchMouseEvent`) to produce trusted browser mouse events and native page hover/click behavior. This does **not** physically move the operating-system mouse cursor. Exact physical cursor movement requires a separately installed native desktop helper; Chrome extensions cannot do that by themselves. Sites that require real hardware input, CAPTCHA, or protected access may still reject automation.

The extension records DOM actions, not a screen video. Password, file-upload, payment-card and one-time-code fields are excluded. Use only on sites you are authorized to operate. Do not automate purchases, bulk messaging, destructive actions, CAPTCHA or access-control bypasses. Protected pages, canvas interfaces and cross-origin frames need specialized support.
