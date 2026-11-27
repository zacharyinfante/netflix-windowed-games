(() => {
  const toggle = document.getElementById("toggle") as HTMLInputElement;
  const status = document.getElementById("status") as HTMLDivElement;

  function render(enabled: boolean): void {
    toggle.checked = enabled;
    status.textContent = enabled ? "On" : "Off";
    status.classList.toggle("off", !enabled);
  }

  chrome.storage.local.get({ enabled: true }).then((res) => {
    render(!!(res as { enabled: boolean }).enabled);
  });

  toggle.addEventListener("change", async () => {
    const enabled = toggle.checked;
    await chrome.storage.local.set({ enabled });
    render(enabled);
  });
})();
