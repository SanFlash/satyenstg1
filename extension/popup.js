/* Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved. Project: SatyTracker78. */
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
    show("Repeat loop started. Reopen this popup to stop it.");
    await refresh();
  } catch (error) { show(error.message || String(error)); }
});
$("stop").addEventListener("click", async () => { await send({ type: "LOOP_STOP" }); await refresh(); show("Replay stopped."); });
chrome.storage.onChanged.addListener(refresh);
refresh();

function renderDesktop(state) {
  $("desktopStatus").textContent = state?.status || "Not connected";
  $("desktopStop").disabled = !state?.armed;
  $("desktopEnable").disabled = Boolean(state?.status?.includes("Connecting") || state?.status?.includes("requesting"));
  if (state?.error) show(state.error + " Open Desktop Helper Setup for the guided installer and troubleshooting steps.");
}
$("desktopEnable").addEventListener("click", async () => {
  $("desktopEnable").disabled = true;
  $("desktopStatus").textContent = "Connecting to Windows helper…";
  try {
    const result = await send({ type: "DESKTOP_ENABLE" });
    renderDesktop(result.state || { status: "Not connected", error: result.error });
    if (!result.ok) show(result.error || "Could not connect to the desktop helper.");
    else if (result.state?.armed) show("Desktop helper connected and locally authorized.");
  } catch (error) {
    renderDesktop({ status: "Not connected", error: error.message || String(error) });
  }
});
$("desktopStop").addEventListener("click", async () => {
  const result = await send({ type: "DESKTOP_STOP" });
  renderDesktop(result.state);
  show("Desktop permission revoked. Browser recording and replay are unaffected.");
});
chrome.runtime.onMessage.addListener(message => {
  if (message?.type === "DESKTOP_STATUS") renderDesktop(message.state);
});
send({ type: "DESKTOP_GET_STATUS" }).then(renderDesktop).catch(() => renderDesktop({ status: "Not connected" }));
