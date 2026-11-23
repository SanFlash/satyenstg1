/* Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved. Project: MouseFlow AI. */
const KEY = "mouseflowExtensionState";
const dispatchingTabs = new Set();
const initial = { mode: "idle", steps: [], stepIndex: 0, iterations: 0, delayMs: 1000, stepDelayMs: 450, stopOnError: true, tabId: null, lastError: "", inFlight: false, inFlightUrl: "" };

async function getState() {
  const data = await chrome.storage.local.get(KEY);
  return { ...initial, ...(data[KEY] || {}) };
}
async function setState(value) {
  await chrome.storage.local.set({ [KEY]: value });
  if (value.tabId != null) {
    try { await chrome.tabs.sendMessage(value.tabId, { type: "MF_STATE", state: value }); } catch {}
  }
}
async function inject(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["recorder.js"] });
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
    if (step.url && tab.url) {
      try {
        if (new URL(step.url).origin !== new URL(tab.url).origin) {
          state.mode = "error";
          state.lastError = "Replay reached a different website origin. Cross-site navigation is not supported in one recording.";
          await setState(state);
          return;
        }
      } catch {}
    }
    if (!(await inject(tabId))) return;
    state = await getState();
    if (state.mode !== "replaying" || state.inFlight) return;
    state.inFlight = true;
    state.inFlightUrl = tab.url || "";
    await setState(state);
    try {
      await chrome.tabs.sendMessage(tabId, { type: "MF_EXECUTE_STEP", stepIndex: state.stepIndex, step });
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
  if (state.stepIndex >= state.steps.length) {
    state.stepIndex = 0;
    state.iterations += 1;
  }
  await setState(state);
  const wait = state.stepIndex === 0 ? state.delayMs : state.stepDelayMs;
  setTimeout(() => dispatch(state.tabId), wait);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const senderTabId = sender.tab?.id ?? null;
    let state = await getState();
    switch (message.type) {
      case "GET_STATE":
        sendResponse(state);
        return;
      case "SHOW_OVERLAY": {
        const tabId = message.tabId ?? senderTabId;
        if (tabId == null) { sendResponse({ ok: false, error: "Open a normal website tab first." }); return; }
        const ok = await inject(tabId);
        if (ok) {
          state = await getState();
          if (state.mode === "idle" || state.tabId == null) {
            state.tabId = tabId;
            state.lastError = "";
            await setState(state);
          }
        }
        sendResponse({ ok });
        return;
      }
      case "RECORD_START": {
        const tabId = message.tabId ?? senderTabId;
        if (tabId == null) { sendResponse({ ok: false, error: "Open a normal website tab first." }); return; }
        state = { ...initial, mode: "recording", tabId, steps: [] };
        await setState(state);
        const ok = await inject(tabId);
        sendResponse({ ok, error: ok ? "" : (await getState()).lastError });
        return;
      }
      case "RECORD_STEP":
        if (state.mode === "recording" && state.tabId === senderTabId && message.step && state.steps.length < 2000) {
          state.steps.push(message.step);
          await setState(state);
        }
        sendResponse({ ok: true, count: state.steps.length });
        return;
      case "RECORD_STOP":
        if (state.mode === "recording" && (senderTabId == null || state.tabId === senderTabId)) {
          state.mode = "idle";
          state.lastError = "";
          await setState(state);
        }
        sendResponse({ ok: true, steps: state.steps });
        return;
      case "LOOP_START": {
        const tabId = message.tabId ?? senderTabId ?? state.tabId;
        if (!state.steps.length) { sendResponse({ ok: false, error: "Record at least one action before starting the repeat loop." }); return; }
        if (tabId == null) { sendResponse({ ok: false, error: "Open the page containing the recorded task." }); return; }
        state = { ...state, mode: "replaying", tabId, stepIndex: 0, iterations: 0, inFlight: false, delayMs: Math.max(0, Math.min(30000, Number(message.delayMs) || 0)), stepDelayMs: Math.max(0, Math.min(3000, Number(message.stepDelayMs) || 0)), stopOnError: message.stopOnError !== false, lastError: "" };
        await setState(state);
        await dispatch(tabId);
        sendResponse({ ok: true });
        return;
      }
      case "REPLAY_RESULT":
        await replayResult(message, sender);
        sendResponse({ ok: true });
        return;
      case "LOOP_STOP":
        state.mode = "idle";
        state.inFlight = false;
        state.lastError = "";
        await setState(state);
        sendResponse({ ok: true });
        return;
      default:
        sendResponse({ ok: false, error: "Unknown MouseFlow command." });
    }
  })().catch(error => sendResponse({ ok: false, error: String(error) }));
  return true;
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  let state = await getState();
  if (state.tabId !== tabId) return;
  if (state.mode === "recording" || state.mode === "replaying" || state.mode === "idle") await inject(tabId);
  state = await getState();
  // A full-page navigation unloads the content script before it can acknowledge a click.
  // Treat the navigation as completion of that click, then resume on the newly loaded page.
  if (state.mode === "replaying" && state.inFlight && state.inFlightUrl && tab?.url && tab.url !== state.inFlightUrl) {
    state.inFlight = false;
    state.inFlightUrl = "";
    state.stepIndex += 1;
    if (state.stepIndex >= state.steps.length) {
      state.stepIndex = 0;
      state.iterations += 1;
    }
    await setState(state);
    const wait = state.stepIndex === 0 ? state.delayMs : state.stepDelayMs;
    setTimeout(() => dispatch(tabId), wait);
    return;
  }
  if (state.mode === "replaying" && !state.inFlight) dispatch(tabId);
});
chrome.tabs.onRemoved.addListener(async tabId => {
  const state = await getState();
  if (state.tabId === tabId) {
    state.mode = "idle";
    state.inFlight = false;
    state.inFlightUrl = "";
    state.lastError = "Target tab was closed.";
    await setState(state);
  }
});
