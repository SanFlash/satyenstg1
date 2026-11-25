/* Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved. Project: SatyTracker78. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const background = fs.readFileSync(new URL("./background.js", import.meta.url), "utf8");
const recorder = fs.readFileSync(new URL("./recorder.js", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("./manifest.json", import.meta.url), "utf8"));
const popup = fs.readFileSync(new URL("./popup.html", import.meta.url), "utf8");

test("Manifest is a Chrome Manifest V3 extension with required capabilities", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.permissions.includes("scripting"));
  assert.ok(manifest.permissions.includes("storage"));
  assert.ok(manifest.permissions.includes("nativeMessaging"));
  assert.ok(!manifest.permissions.includes("debugger"));
  assert.ok(manifest.background.service_worker);
});

test("Background and page recorder use the same replay command", () => {
  assert.match(background, /MF_EXECUTE_STEP/);
  assert.match(recorder, /MF_EXECUTE_STEP/);
});

test("Replay waits for smooth scrolling to settle before continuing", () => {
  assert.ok(recorder.includes("waitForScrollSettled"));
  assert.ok(recorder.includes("await waitForScrollSettled(el)"));
  assert.ok(recorder.includes("const fastScrollTo"));
  assert.ok(recorder.includes("duration = 260"));
  assert.ok(recorder.includes('behavior: "instant"'));
  assert.ok(recorder.includes("stableFrames >= 3"));
  assert.ok(recorder.includes("await waitForScrollSettled();"));
});

test("Scroll recording debounces movement into stable flow checkpoints", () => {
  assert.ok(recorder.includes("scrollCaptureTimer"));
  assert.ok(recorder.includes("clearTimeout(scrollCaptureTimer)"));
  assert.ok(recorder.includes("},180)"));
});

test("Replay acknowledgements include the exact step index", () => {
  assert.match(recorder, /REPLAY_RESULT/);
  assert.match(recorder, /stepIndex:index/);
  assert.ok(background.includes("message.stepIndex !== state.stepIndex"));
});

test("Native desktop actions wait for correlated host acknowledgement", () => {
  assert.match(background, /nativeRequests\s*=\s*new Map/);
  assert.match(background, /requestId/);
  assert.match(background, /await nativeRequest\("action"/);
  assert.match(background, /NATIVE_REQUEST_TIMEOUT_MS/);
  assert.match(background, /rejectNativeRequests/);
  assert.doesNotMatch(background, /nativePort\.postMessage\(\{ command: "action"[\s\S]{0,100}?sendResponse\(\{ ok: true \}\)/);
});

test("Desktop permission remains explicit and can be revoked", () => {
  assert.match(background, /nativeRequest\("arm"/);
  assert.match(background, /closeNativePort\(true/);
  assert.match(popup, /desktopStop/);
});

test("Tracker UI stays in the extension popup, not on the webpage", () => {
  assert.doesNotMatch(recorder, /mouseflow-ai-overlay|attachShadow|<section class=/);
  assert.doesNotMatch(popup, /showOverlay|on-page controls/i);
  for (const id of ["record", "stopRecord", "play", "stop"]) assert.match(popup, new RegExp('id="' + id + '"'));
});

test("Clicks use browser-level mouse dispatch without an injected cursor", () => {
  assert.doesNotMatch(recorder, /MF_MOUSE_CLICK/);
  assert.doesNotMatch(background, /chrome\.debugger|Input\.dispatchMouseEvent/);
  assert.ok(recorder.includes("const moveCursor"));
  assert.ok(recorder.includes("const moveToElement"));
  assert.ok(recorder.includes("const updateHover"));
  assert.ok(recorder.includes("pointerover"));
  assert.ok(recorder.includes("const c1x"));
  assert.ok(recorder.includes("requestAnimationFrame"));
  assert.ok(recorder.includes("clickFeedback"));
  assert.match(popup, /id="stepDelay"/);
  assert.ok(background.includes("stepDelayMs"));
});
