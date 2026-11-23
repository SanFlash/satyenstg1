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
$("showOverlay").addEventListener("click", async () => {
  try {
    const tab = await activeTab();
    const result = await send({ type: "SHOW_OVERLAY", tabId: tab.id });
    if (!result.ok) throw new Error(result.error || "Could not show controls.");
    show("Controls added to the active webpage. You can use them without reopening this popup.");
  } catch (error) { show(error.message || String(error)); }
});
$("record").addEventListener("click", async () => {
  try {
    const tab = await activeTab();
    const result = await send({ type: "RECORD_START", tabId: tab.id });
    if (!result.ok) throw new Error(result.error || "Could not start recording.");
    show("Recording started. Perform the task, then choose Finish on the page.");
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
    const result = await send({ type: "LOOP_START", tabId: tab.id, delayMs: Number($("delay").value), stopOnError: $("stopOnError").checked });
    if (!result.ok) throw new Error(result.error || "Could not start replay.");
    show("Repeat loop started. Use Stop on the page or in this popup to end it.");
    await refresh();
  } catch (error) { show(error.message || String(error)); }
});
$("stop").addEventListener("click", async () => { await send({ type: "LOOP_STOP" }); await refresh(); show("Replay stopped."); });
chrome.storage.onChanged.addListener(refresh);
refresh();