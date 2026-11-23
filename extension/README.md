# MouseFlow AI Chrome extension

## Install / update
1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Choose **Load unpacked** and select this repository's `extension` folder.
4. After pulling an update, click the extension card's **Reload** icon. Refresh the target website too.
5. Pin MouseFlow AI to the toolbar.

## Use the visible page controls
1. Open a normal website tab (http/https).
2. Click the extension icon and choose **Show controls on active page**. A floating MouseFlow panel appears in the top-right corner of the webpage.
3. Use **Record** on the floating panel and perform the task once.
4. Click **Finish**. Then click **Repeat**. It repeats until you press **Stop** on the page or in the extension popup.

The recorder stores supported DOM actions locally: clicks, text input, dropdown/checkbox/radio changes and page scrolling. It records action steps, not a screen-video file. Password, file-upload, payment-card and one-time-code fields are excluded. The floating panel is injected into the active page and is excluded from recording.

## Troubleshooting
- If the panel does not appear, make sure the current tab is a normal website, not `chrome://`, the Chrome Web Store, a PDF viewer or another protected page. Click the extension's Reload icon, refresh the website, then click **Show controls on active page**.
- If a replay stops, read the error shown in the floating panel. A selector may have changed or the page may have blocked automation.
- Keep the target tab open. Do not navigate away manually while a loop is running.
- The first replay should be watched. Test with a harmless action before enabling a long loop.

## Safety and limitations
Use only on websites/accounts you are authorized to operate. Do not use loops for purchases, bulk messaging, deleting data, bypassing CAPTCHAs, access controls, rate limits or other site protections. Dynamic apps, cross-origin frames and canvas interfaces may need dedicated adapters.