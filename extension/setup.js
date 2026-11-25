/* Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved. */
const idNode = document.getElementById("extensionId");
const copyButton = document.getElementById("copyId");
const copyStatus = document.getElementById("copyStatus");
const extensionId = globalThis.chrome?.runtime?.id || "";
idNode.textContent = extensionId || "Open this page from the SatyTracker78 extension.";
copyButton.disabled = !extensionId;
copyButton.addEventListener("click", async () => {
  if (!extensionId) return;
  try {
    await navigator.clipboard.writeText(extensionId);
    copyButton.textContent = "Copied";
    copyStatus.textContent = "Extension ID copied. Paste it into the Windows installer.";
  } catch {
    copyStatus.textContent = "Clipboard access was blocked. Select and copy the ID manually.";
  }
});
