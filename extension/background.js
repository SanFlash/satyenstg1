/* Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved. Project: SatyTracker78. */
const KEY = "mouseflowExtensionState";
const dispatchingTabs = new Set();
const NATIVE_HOST = "com.satytracker78.desktop";
const NATIVE_REQUEST_TIMEOUT_MS = 10000;
let nativePort = null;
let nativeState = { connected: false, armed: false, status: "Not connected", error: "" };
let nativeHandshake = null;
let nativeRequestSequence = 0;
const nativeRequests = new Map();

function publishNativeState() {
  chrome.runtime.sendMessage({ type: "DESKTOP_STATUS", state: nativeState }).catch(() => {});
}
function rejectNativeRequests(error) {
  for (const pending of nativeRequests.values()) {
    clearTimeout(pending.timer);
    pending.reject(error);
  }
  nativeRequests.clear();
}
function closeNativePort(revoke = true, reason = "") {
  const port = nativePort;
  nativePort = null;
  if (revoke && port) { try { port.postMessage({ command: "stop" }); } catch {} }
  if (port) { try { port.disconnect(); } catch {} }
  rejectNativeRequests(new Error(reason || "Desktop helper disconnected."));
  nativeHandshake = null;
  nativeState = { connected: false, armed: false, status: "Not connected", error: reason };
  publishNativeState();
}
function nativeRequest(command, extra = {}, timeoutMs = NATIVE_REQUEST_TIMEOUT_MS) {
  if (!nativePort) return Promise.reject(new Error("Desktop helper is not connected."));
  const requestId = "st-" + (++nativeRequestSequence);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      nativeRequests.delete(requestId);
      reject(new Error("Desktop helper did not respond within " + Math.round(timeoutMs / 1000) + " seconds."));
    }, timeoutMs);
    nativeRequests.set(requestId, { resolve, reject, timer });
    try { nativePort.postMessage({ command, requestId, ...extra }); }
    catch (error) {
      clearTimeout(timer);
      nativeRequests.delete(requestId);
      reject(error);
    }
  });
}
function connectNativeHelper() {
  if (nativeHandshake) return nativeHandshake;
  if (nativePort && nativeState.connected) return Promise.resolve(nativeState);
  nativeState = { connected: false, armed: false, status: "Connecting to Windows helper…", error: "" };
  publishNativeState();
  nativeHandshake = new Promise(async (resolve, reject) => {
    let port;
    try { port = chrome.runtime.connectNative(NATIVE_HOST); }
    catch (error) {
      nativeState = { connected: false, armed: false, status: "Not connected", error: error.message || String(error) };
      publishNativeState();
      nativeHandshake = null;
      reject(error);
      return;
    }
    nativePort = port;
    let closed = false;
    const handshakeTimer = setTimeout(() => {
      if (closed || nativeState.connected) return;
      const error = new Error("Native helper did not answer the status handshake within 10 seconds. Check the installed host manifest and native-host.log.");
      nativeState = { connected: false, armed: false, status: "Connection timed out", error: error.message };
      publishNativeState();
      closeNativePort(false, error.message);
      reject(error);
    }, NATIVE_REQUEST_TIMEOUT_MS);

    port.onMessage.addListener(message => {
      if (message?.requestId && nativeRequests.has(message.requestId)) {
        const pending = nativeRequests.get(message.requestId);
        nativeRequests.delete(message.requestId);
        clearTimeout(pending.timer);
        if (message.ok === false) pending.reject(new Error(message.error || "Native helper rejected the request."));
        else pending.resolve(message);
        return;
      }
      if (message?.connected) {
        clearTimeout(handshakeTimer);
        nativeState = { connected: true, armed: false, status: "Connected — awaiting local permission", error: "" };
        publishNativeState();
        nativeRequest("arm", {}, 120000).then(result => {
          nativeState = result.armed
            ? { connected: true, armed: true, status: "Connected · local permission active for up to 5 minutes", error: "" }
            : { connected: true, armed: false, status: "Connected · permission not granted", error: result.error || "Local permission was not granted." };
          publishNativeState();
          resolve(nativeState);
        }).catch(error => {
          nativeState = { connected: false, armed: false, status: "Permission request failed", error: error.message || String(error) };
          publishNativeState();
          closeNativePort(true, nativeState.error);
          reject(error);
        });
        return;
      }
      if (message?.armed === false && message?.ok === true) {
        nativeState = { connected: true, armed: false, status: "Connected · permission inactive", error: "" };
        publishNativeState();
      }
    });
    port.onDisconnect.addListener(() => {
      closed = true;
      clearTimeout(handshakeTimer);
      const reason = chrome.runtime.lastError?.message || "Chrome disconnected from the native desktop helper.";
      nativePort = null;
      rejectNativeRequests(new Error(reason));
      nativeState = { connected: false, armed: false, status: "Not connected", error: reason };
      nativeHandshake = null;
      publishNativeState();
      reject(new Error(reason));
    });
    try {
      const status = await nativeRequest("status");
      if (!status.connected) throw new Error("Native helper did not confirm its connection.");
      // The message listener above receives this status response and the returned promise resolves here.
    } catch (error) {
      if (nativePort === port) closeNativePort(false, error.message || String(error));
      nativeHandshake = null;
      reject(error);
    }
  }).finally(() => { nativeHandshake = null; });
  return nativeHandshake;
}

const NEXT_STEP_ALARM = "satytracker78-next-step";
const initial = { mode: "idle", steps: [], stepIndex: 0, iterations: 0, delayMs: 1000, stepDelayMs: 900, stopOnError: true, tabId: null, startUrl: "", lastError: "", inFlight: false, inFlightUrl: "", inFlightNavigationStarted: false, resettingLoop: false };
async function getState() {
  const data = await chrome.storage.local.get(KEY);
  return { ...initial, ...(data[KEY] || {}) };
}
function scheduleNextStep(delayMs) {
  chrome.alarms.clear(NEXT_STEP_ALARM).then(() => chrome.alarms.create(NEXT_STEP_ALARM, { when: Date.now() + Math.max(0, delayMs) }));
}
async function setState(value) {
  await chrome.storage.local.set({ [KEY]: value });
  if (value.tabId != null) {
    try { await chrome.tabs.sendMessage(value.tabId, { type: "MF_STATE", state: value }); } catch {}
  }
}
async function inject(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ["recorder.js"] });
    return true;
  } catch {
    const state = await getState();
    state.lastError = "Chrome cannot inject into this page. Open a regular http:// or https:// website, then try again.";
    if (state.mode === "recording" || state.mode === "replaying") state.mode = "error";
    await setState(state);
    return false;
  }
}
async function dispatch(tabId) {
  if (dispatchingTabs.has(tabId)) return;
  dispatchingTabs.add(tabId);
  try {
    let state = await getState();
    if (state.mode !== "replaying" || state.tabId !== tabId || state.inFlight) return;
    const step = state.steps[state.stepIndex];
    if (!step) {
      state.mode = "error";
      state.lastError = "No replayable actions were found. Record the task again.";
      await setState(state);
      return;
    }
    let tab;
    try { tab = await chrome.tabs.get(tabId); }
    catch {
      state.mode = "idle";
      state.lastError = "The target tab was closed.";
      await setState(state);
      return;
    }
    if (tab.status !== "complete") return;
    if (step.url && tab.url && step.url !== tab.url) {
      if (!/^https?:\/\//i.test(step.url)) {
        state.mode = "error";
        state.lastError = "A recorded step points to a non-web URL. Replay stopped for safety.";
        await setState(state);
        return;
      }
      await chrome.tabs.update(tabId, { url: step.url });
      return;
    }
    if (tab.url && !/^https?:\/\//i.test(tab.url)) {
      state.mode = "error";
      state.lastError = "For safety, replay is limited to regular HTTP and HTTPS pages.";
      await setState(state);
      return;
    }
    if (!(await inject(tabId))) return;
    state = await getState();
    if (state.mode !== "replaying" || state.inFlight) return;
    state.inFlight = true;
    state.inFlightUrl = tab.url || "";
    state.inFlightNavigationStarted = false;
    await setState(state);
    try {
      await chrome.tabs.sendMessage(tabId, { type: "MF_EXECUTE_STEP", stepIndex: state.stepIndex, step }, Number.isInteger(step.frameId) ? { frameId: step.frameId } : {});
    } catch {
      state = await getState();
      state.mode = "error";
      state.inFlight = false;
      state.lastError = "The page recorder did not respond. Refresh the website and record the flow again.";
      await setState(state);
    }
  } finally {
    dispatchingTabs.delete(tabId);
  }
}
async function replayResult(message, sender) {
  let state = await getState();
  if (state.mode !== "replaying" || state.tabId !== sender.tab?.id || !state.inFlight || message.stepIndex !== state.stepIndex) return;
  state.inFlight = false;
  state.inFlightUrl = "";
  if (!message.ok && state.stopOnError) {
    state.mode = "error";
    state.lastError = message.error || "A replay action failed.";
    await setState(state);
    return;
  }
  state.stepIndex += 1;
  let completedIteration = false;
  if (state.stepIndex >= state.steps.length) {
    state.stepIndex = 0;
    state.iterations += 1;
    completedIteration = true;
  }
  await setState(state);
  if (completedIteration && state.startUrl) {
    try {
      const tab = await chrome.tabs.get(state.tabId);
      state.resettingLoop = true;
      await setState(state);
      if (tab.url === state.startUrl) await chrome.tabs.reload(state.tabId);
      else await chrome.tabs.update(state.tabId, { url: state.startUrl });
      return;
    } catch (error) {
      state.mode = "error";
      state.resettingLoop = false;
      state.lastError = "Could not return to the recorded starting page: " + (error.message || String(error));
      await setState(state);
      return;
    }
  }
  const wait = completedIteration ? state.delayMs : state.stepDelayMs;
  scheduleNextStep(wait);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const senderTabId = sender.tab?.id ?? null;
    let state = await getState();
    switch (message.type) {
      case "GET_STATE": sendResponse(state); return;
      case "DESKTOP_GET_STATUS": sendResponse(nativeState); return;
      case "DESKTOP_ENABLE":
        try { sendResponse({ ok: true, state: await connectNativeHelper() }); }
        catch (error) { sendResponse({ ok: false, error: error.message || String(error), state: nativeState }); }
        return;
      case "DESKTOP_STOP":
        closeNativePort(true, "Permission revoked by user.");
        sendResponse({ ok: true, state: nativeState });
        return;
      case "DESKTOP_ACTION":
        if (!nativePort || !nativeState.armed) { sendResponse({ ok: false, error: "Desktop helper is not connected and locally authorized." }); return; }
        try {
          const response = await nativeRequest("action", { action: message.action || {} });
          sendResponse({ ok: true, result: response });
        } catch (error) { sendResponse({ ok: false, error: error.message || String(error) }); }
        return;
      case "SHOW_OVERLAY": {
        const tabId = message.tabId ?? senderTabId;
        if (tabId == null) { sendResponse({ ok: false, error: "Open a normal website tab first." }); return; }
        const ok = await inject(tabId);
        if (ok) {
          state = await getState();
          if (state.mode === "idle" || state.tabId == null) { state.tabId = tabId; state.lastError = ""; await setState(state); }
        }
        sendResponse({ ok }); return;
      }
      case "RECORD_START": {
        const tabId = message.tabId ?? senderTabId;
        if (tabId == null) { sendResponse({ ok: false, error: "Open a normal website tab first." }); return; }
        await chrome.alarms.clear(NEXT_STEP_ALARM);
        let startTab;
        try { startTab = await chrome.tabs.get(tabId); } catch {}
        state = { ...initial, mode: "recording", tabId, startUrl: startTab?.url || "", steps: [] };
        await setState(state);
        const ok = await inject(tabId);
        sendResponse({ ok, error: ok ? "" : (await getState()).lastError }); return;
      }
      case "RECORD_STEP":
        if (state.mode === "recording" && state.tabId === senderTabId && message.step && state.steps.length < 2000) {
          state.steps.push({ ...message.step, frameId: Number.isInteger(sender.frameId) ? sender.frameId : 0 });
          await setState(state);
        }
        sendResponse({ ok: true, count: state.steps.length }); return;
      case "RECORD_STOP":
        if (state.mode === "recording" && (senderTabId == null || state.tabId === senderTabId)) { state.mode = "idle"; state.lastError = ""; await setState(state); }
        sendResponse({ ok: true, steps: state.steps }); return;
      case "LOOP_START": {
        const tabId = message.tabId ?? senderTabId ?? state.tabId;
        if (!state.steps.length) { sendResponse({ ok: false, error: "Record at least one action before starting the repeat loop." }); return; }
        if (tabId == null) { sendResponse({ ok: false, error: "Open the page containing the recorded task." }); return; }
        state = { ...state, mode: "replaying", tabId, stepIndex: 0, iterations: 0, inFlight: false, inFlightNavigationStarted: false, resettingLoop: false, delayMs: Math.max(0, Math.min(30000, Number(message.delayMs) || 0)), stepDelayMs: Math.max(0, Math.min(3000, Number(message.stepDelayMs) || 0)), stopOnError: message.stopOnError !== false, lastError: "" };
        await chrome.alarms.clear(NEXT_STEP_ALARM);
        let active;
        try { active = await chrome.tabs.get(tabId); } catch {}
        if (state.startUrl && active?.url && active.url !== state.startUrl) {
          state.resettingLoop = true; await setState(state); await chrome.tabs.update(tabId, { url: state.startUrl });
        } else { await setState(state); await dispatch(tabId); }
        sendResponse({ ok: true }); return;
      }
      case "REPLAY_RESULT": await replayResult(message, sender); sendResponse({ ok: true }); return;
      case "LOOP_STOP":
        await chrome.alarms.clear(NEXT_STEP_ALARM);
        state.mode = "idle"; state.inFlight = false; state.lastError = "";
        await setState(state); sendResponse({ ok: true }); return;
      default: sendResponse({ ok: false, error: "Unknown SatyTracker78 command." });
    }
  })().catch(error => sendResponse({ ok: false, error: String(error) }));
  return true;
});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== NEXT_STEP_ALARM) return;
  const state = await getState();
  if (state.mode === "replaying" && state.tabId != null && !state.inFlight) await dispatch(state.tabId);
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  let state = await getState();
  if (state.tabId !== tabId) return;
  if (changeInfo.status === "loading" && state.mode === "replaying" && state.inFlight) {
    state.inFlightNavigationStarted = true; await setState(state); return;
  }
  if (changeInfo.status !== "complete") return;
  if (state.mode === "recording" || state.mode === "replaying" || state.mode === "idle") await inject(tabId);
  state = await getState();
  if (state.mode === "replaying" && state.resettingLoop) {
    state.resettingLoop = false; state.inFlight = false; state.inFlightUrl = ""; state.inFlightNavigationStarted = false;
    await setState(state); scheduleNextStep(state.delayMs); return;
  }
  if (state.mode === "replaying" && state.inFlight &&
      (state.inFlightNavigationStarted || (state.inFlightUrl && tab?.url && tab.url !== state.inFlightUrl))) {
    state.inFlight = false; state.inFlightUrl = ""; state.inFlightNavigationStarted = false; state.stepIndex += 1;
    if (state.stepIndex >= state.steps.length) { state.stepIndex = 0; state.iterations += 1; }
    await setState(state); scheduleNextStep(state.stepIndex === 0 ? state.delayMs : state.stepDelayMs); return;
  }
  if (state.mode === "replaying" && !state.inFlight) await dispatch(tabId);
});
chrome.runtime.onStartup.addListener(async () => {
  const state = await getState();
  if (state.mode === "replaying" && state.tabId != null) {
    if (state.inFlight) { state.inFlight = false; state.inFlightUrl = ""; state.inFlightNavigationStarted = false; await setState(state); }
    scheduleNextStep(250);
  }
});
chrome.tabs.onRemoved.addListener(async tabId => {
  const state = await getState();
  if (state.tabId === tabId) {
    state.mode = "idle"; state.inFlight = false; state.inFlightUrl = ""; state.inFlightNavigationStarted = false;
    await chrome.alarms.clear(NEXT_STEP_ALARM);
    state.lastError = "Target tab was closed."; await setState(state);
  }
});
