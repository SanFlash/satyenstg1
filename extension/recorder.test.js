const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const background = fs.readFileSync("extension/background.js", "utf8");
const recorder = fs.readFileSync("extension/recorder.js", "utf8");
const manifest = require("./manifest.json");

test("Manifest is a Chrome Manifest V3 extension with required capabilities", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.permissions.includes("scripting"));
  assert.ok(manifest.permissions.includes("storage"));
  assert.ok(manifest.background.service_worker);
});

test("Background and page recorder use the same replay command", () => {
  assert.match(background, /type: "MF_EXECUTE_STEP"/);
  assert.match(recorder, /message\.type === "MF_EXECUTE_STEP"/);
});

test("Replay acknowledgements include the exact step index", () => {
  assert.match(recorder, /send\("REPLAY_RESULT", \{ stepIndex, ok: true \}\)/);
  assert.match(background, /message\.stepIndex !== state\.stepIndex/);
});

test("On-page controls and record/repeat/stop actions are present", () => {
  for (const id of ["record", "finish", "repeat", "stop"]) assert.ok(recorder.includes('id="' + id + '"'));
  for (const command of ["RECORD_START", "RECORD_STOP", "LOOP_START", "LOOP_STOP"]) assert.ok(recorder.includes('"' + command + '"'));
});
