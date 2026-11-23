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

let desktopPort = null;
let desktopConnected = false;
function desktopStatus(message, armed = false) {
  $("desktopStatus").textContent = message;
  $("desktopStop").disabled = !armed;
  $("desktopEnable").disabled = message.includes("Connecting") || message.includes("permission window");
}
function desktopFailure(message) {
  desktopConnected = false;
  desktopPort = null;
  desktopStatus("Not connected");
  show(message + " If setup was never run, open the downloaded project folder and double-click extension/native-host/install-easy.bat. For diagnostics, run diagnose.bat in that folder.");
}
$("desktopEnable").addEventListener("click", () => {
  if (desktopPort) {
    try { desktopPort.disconnect(); } catch {}
    desktopPort = null;
  }
  desktopStatus("Connecting to Windows helper…");
  try {
    const port = chrome.runtime.connectNative("com.satytracker78.desktop");
    desktopPort = port;
    let stage = "checking";
    port.onMessage.addListener(message => {
      if (stage === "checking") {
        if (!message?.connected) {
          desktopFailure(message?.error || "The native helper responded incorrectly.");
          return;
        }
        stage = "arming";
        desktopStatus("Connected — waiting for permission window…");
        port.postMessage({ command: "arm" });
        return;
      }
      if (message?.armed) {
        desktopConnected = true;
        desktopStatus("Connected · permission active for up to 5 minutes", true);
        show("Desktop helper connected and locally authorized.");
      } else if (message?.ok === false) {
        desktopStatus("Connected · permission not granted");
        show(message.error || "Desktop permission was not granted.");
        $("desktopEnable").disabled = false;
      } else {
        desktopStatus("Connected · not armed");
        $("desktopEnable").disabled = false;
      }
    });
    port.onDisconnect.addListener(() => {
      const reason = chrome.runtime.lastError?.message || "Chrome could not communicate with the native helper.";
      desktopFailure(reason);
    });
    port.postMessage({ command: "status" });
  } catch (error) {
    desktopFailure("Could not start the native helper: " + (error.message || String(error)));
  }
});
$("desktopStop").addEventListener("click", () => {
  if (!desktopPort) return;
  try { desktopPort.postMessage({ command: "stop" }); } catch {}
  desktopConnected = false;
  desktopStatus("Connected · desktop control stopped");
  show("Desktop permission revoked. Browser recording and replay are unaffected.");
  $("desktopEnable").disabled = false;
});
