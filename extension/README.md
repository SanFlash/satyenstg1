# MouseFlow AI Chrome extension

## Install / update
1. Open chrome://extensions and enable Developer mode.
2. Choose Load unpacked and select this repository's extension folder.
3. After pulling an update, click Reload on the extension card and refresh the target website.

## Use
1. Open a normal http/https website and choose Show controls on active page.
2. Click Record, perform the task once, then Finish.
3. Click Repeat. It loops until Stop is pressed.

## Resilient replay and pointer
New recordings save visible text, accessible role, labels, attributes, nearby text context and normalized position in addition to a best-effort selector. Replay tries the selector, then semantic/context matching, then a position fallback. Old recordings without these hints use best-effort ID-to-text inference; re-record for strongest matching.

Replay animates a visible pointer inside the webpage and simulates hover/click events. Chrome security prevents a content script from moving the actual operating-system cursor. Simulated events are not trusted hardware input, so sites requiring trusted physical input may reject them.

The extension records DOM actions, not a screen video. Password, file-upload, payment-card and one-time-code fields are excluded. Use only on sites you are authorized to operate. Do not automate purchases, bulk messaging, destructive actions, CAPTCHA or access-control bypasses. Protected pages, canvas interfaces and cross-origin frames need specialized support.
