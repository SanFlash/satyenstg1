(() => {
  if (window.__mouseflowContentInstalled) return;
  window.__mouseflowContentInstalled = true;

  const send = (type, payload = {}) => chrome.runtime.sendMessage({ type, ...payload }).catch(() => ({}));
  const privateField = el => !el || el.matches('input[type="password"],input[type="file"],input[autocomplete*="cc-"],input[autocomplete*="one-time-code"],[data-mouseflow-private]') || !!el.closest("[data-mouseflow-private]");
  const selectorFor = el => {
    if (el.id) return "#" + CSS.escape(el.id);
    for (const attr of ["data-testid", "data-test", "name", "aria-label"]) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      const candidate = el.tagName.toLowerCase() + "[" + attr + "=" + JSON.stringify(value) + "]";
      try { if (document.querySelectorAll(candidate).length === 1) return candidate; } catch {}
    }
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body && parts.length < 7) {
      let part = node.tagName.toLowerCase();
      const classes = [...node.classList].filter(Boolean).slice(0, 2);
      if (classes.length) part += "." + classes.map(CSS.escape).join(".");
      const parent = node.parentElement;
      if (parent) {
        const peers = [...parent.children].filter(child => child.tagName === node.tagName);
        if (peers.length > 1) part += ":nth-of-type(" + (peers.indexOf(node) + 1) + ")";
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  };
  const record = (action, el, extra = {}) => {
    if (privateField(el)) return;
    const step = { action, selector: selectorFor(el), tag: el.tagName.toLowerCase(), url: location.href, at: Date.now(), ...extra };
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      if (el.type === "checkbox" || el.type === "radio") step.checked = el.checked;
      else step.value = String(el.value).slice(0, 2000);
    }
    send("RECORD_STEP", { step });
  };

  const host = document.createElement("div");
  host.id = "mouseflow-ai-overlay";
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;top:16px;right:16px;width:280px;max-width:calc(100vw - 32px);";
  (document.documentElement || document.body).appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box} .panel{font:13px/1.45 Inter,system-ui,sans-serif;color:#eef3ff;background:#101827;border:1px solid #394966;border-radius:14px;box-shadow:0 12px 38px #0008;padding:12px}
      .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}.brand{font-weight:800;font-size:13px}.state{font-size:10px;color:#9fb0cb}
      .count{font-size:11px;color:#aab8ce;margin:0 0 10px}.buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      button{border:1px solid #425371;border-radius:8px;padding:9px 7px;background:#1b2940;color:#f4f7ff;font:700 11px system-ui;cursor:pointer}
      button.primary{background:#6257e9;border-color:#8178ff}button.play{background:#087d68;border-color:#0eaa8b}button.stop{background:#642d3b;border-color:#a34b61}
      button:disabled{opacity:.4;cursor:not-allowed}.error{color:#ff9aa8;font-size:10px;margin-top:8px;overflow-wrap:anywhere}
      .min{background:none;border:0;padding:0 4px;font-size:18px;color:#c8d3e5}
      .panel.collapsed .body{display:none}
    </style>
    <section class="panel" aria-label="MouseFlow AI controls">
      <div class="top"><span class="brand">◉ MouseFlow AI</span><span><span class="state" id="state">Ready</span> <button class="min" id="min" title="Collapse controls">−</button></span></div>
      <div class="body">
        <p class="count" id="count">0 actions · 0 loops</p>
        <div class="buttons">
          <button class="primary" id="record">● Record</button>
          <button id="finish" disabled>Finish</button>
          <button class="play" id="repeat" disabled>▶ Repeat</button>
          <button class="stop" id="stop" disabled>■ Stop</button>
        </div>
        <div class="error" id="error" role="status"></div>
      </div>
    </section>`;
  const $ = id => shadow.getElementById(id);
  const panel = shadow.querySelector(".panel");
  $("min").addEventListener("click", () => panel.classList.toggle("collapsed"));
  const refresh = async () => {
    try {
      const s = await send("GET_STATE");
      $("state").textContent = s.mode === "recording" ? "Recording" : s.mode === "replaying" ? "Repeating" : s.mode === "error" ? "Error" : "Ready";
      $("count").textContent = s.steps.length + " actions · " + s.iterations + " loops";
      $("record").disabled = s.mode === "recording" || s.mode === "replaying";
      $("finish").disabled = s.mode !== "recording";
      $("repeat").disabled = !s.steps.length || s.mode === "recording" || s.mode === "replaying";
      $("stop").disabled = s.mode !== "replaying";
      $("error").textContent = s.lastError || "";
    } catch {}
  };
  $("record").addEventListener("click", async () => { const r = await send("RECORD_START"); if (!r.ok) $("error").textContent = r.error || "Could not start recording."; refresh(); });
  $("finish").addEventListener("click", async () => { await send("RECORD_STOP"); refresh(); });
  $("repeat").addEventListener("click", async () => { const r = await send("LOOP_START", { delayMs: 1000, stopOnError: true }); if (!r.ok) $("error").textContent = r.error || "Could not start replay."; refresh(); });
  $("stop").addEventListener("click", async () => { await send("LOOP_STOP"); refresh(); });
  chrome.runtime.onMessage.addListener(message => { if (message.type === "MF_STATE") refresh(); });
  const isOverlay = event => event.composedPath().includes(host);
  document.addEventListener("click", event => {
    if (isOverlay(event)) return;
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const el = target?.closest('button,a,[role="button"],input[type="button"],input[type="submit"],summary,[data-testid]');
    if (el) record("click", el);
  }, true);
  document.addEventListener("change", event => {
    if (isOverlay(event)) return;
    const el = event.target;
    if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement && ["checkbox", "radio"].includes(el.type)) record("input", el);
  }, true);
  document.addEventListener("input", event => {
    if (isOverlay(event)) return;
    const el = event.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || privateField(el)) return;
    if (el instanceof HTMLInputElement && !["text", "search", "email", "url", "tel", "number"].includes(el.type)) return;
    clearTimeout(el.__mouseflowTimer);
    el.__mouseflowTimer = setTimeout(() => record("input", el), 450);
  }, true);
  document.addEventListener("scroll", event => {
    if (isOverlay(event) || event.target !== document) return;
    send("RECORD_STEP", { step: { action: "scroll", x: scrollX, y: scrollY, url: location.href, at: Date.now() } });
  }, true);

  const waitForElement = async selector => {
    const start = Date.now();
    while (Date.now() - start < 12000) {
      let element;
      try { element = document.querySelector(selector); } catch {}
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error("Could not find element: " + selector);
  };
  const setNativeValue = (element, value) => {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(element, value); else element.value = value;
  };
  const execute = async (step, stepIndex) => {
    try {
      if (step.action === "scroll") {
        window.scrollTo({ left: step.x || 0, top: step.y || 0, behavior: "instant" });
      } else {
        const element = await waitForElement(step.selector);
        element.scrollIntoView({ block: "center", behavior: "instant" });
        if (step.action === "click") {
          element.click();
        } else if (step.action === "input") {
          if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) {
            element.checked = Boolean(step.checked);
          } else {
            setNativeValue(element, step.value ?? "");
          }
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      await send("REPLAY_RESULT", { stepIndex, ok: true });
    } catch (error) {
      await send("REPLAY_RESULT", { stepIndex, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  };
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === "MF_EXECUTE_STEP") execute(message.step, message.stepIndex);
  });
  refresh();
})();