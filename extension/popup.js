/* Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved. Project: MouseFlow AI. */
const $ = id => document.getElementById(id);
let currentState;
async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active browser tab.");
  return tab;
}
const send = message => chrome.runtime.sendMessage(message);
function show(message) { $("message").textContent = message; }
function render(state) {
  currentState = state;
  $("status").textContent = state.mode === "recording" ? "Recording" : state.mode === "replaying" ? "Repeating" : state.mode === "error" ? "Error" : "Ready";
  $("stepCount").textContent = state.steps.length;
  $("runCount").textContent = state.iterations;
  $("record").disabled = state.mode === "recording" || state.mode === "replaying";
  $("stopRecord").disabled = state.mode !== "recording";
  $("play").disabled = !state.steps.length || state.mode === "recording" || state.mode === "replaying";
  $("stop").disabled = state.mode !== "replaying";
  if (state.lastError) show(state.lastError);
}
async function refresh() { render(await send({ type: "GET_STATE" })); }
$("record").addEventListener("click", async () => {
  try {
    const tab = await activeTab();
    const result = await send({ type: "RECORD_START", tabId: tab.id });
    if (!result.ok) throw new Error(result.error || "Could not start recording.");
    show("Recording started. Perform the task, then reopen this popup and choose Finish recording.");
    await refresh();
  } catch (error) { show(error.message || String(error)); }
});
$("stopRecord").addEventListener("click", async () => {
  const result = await send({ type: "RECORD_STOP" });
  render({ ...currentState, mode: "idle", steps: result.steps || [] });
  show((result.steps || []).length + " actions saved.");
});
$("play").addEventListener("click", async () => {
  try {
    const tab = await activeTab();
    const result = await send({ type: "LOOP_START", tabId: tab.id, delayMs: Number($("delay").value), stepDelayMs: Number($("stepDelay").value), stopOnError: $("stopOnError").checked });
    if (!result.ok) throw new Error(result.error || "Could not start replay.");
    show("Repeat loop started at " + $("stepDelay").selectedOptions[0].textContent + " action pacing. Reopen this popup to stop it.");
    await refresh();
  } catch (error) { show(error.message || String(error)); }
});
$("stop").addEventListener("click", async () => { await send({ type: "LOOP_STOP" }); await refresh(); show("Replay stopped."); });
chrome.storage.onChanged.addListener(refresh);
refresh();