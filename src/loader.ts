// Runs in the isolated world; bridges the on/off setting to the page script.
(() => {
  const DEFAULT_ENABLED = true;

  function post(enabled: boolean): void {
    window.postMessage({ __nwg: "set", enabled }, "*");
  }

  chrome.storage.local.get({ enabled: DEFAULT_ENABLED }).then((res) => {
    post(!!(res as { enabled: boolean }).enabled);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabled) {
      post(!!changes.enabled.newValue);
    }
  });
})();
