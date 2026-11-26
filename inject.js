// Runs in the PAGE's main world at document_start.
// Neutralizes the Fullscreen API so Netflix games stay windowed,
// while telling the game it IS fullscreen so it won't pause or re-prompt.
(() => {
  if (window.__NWG_INSTALLED) return;
  window.__NWG_INSTALLED = true;

  const state = { enabled: true };

  // Receive on/off flag from the extension (loader.js, isolated world).
  window.addEventListener('message', (e) => {
    if (e.source === window && e.data && e.data.__nwg === 'set') {
      state.enabled = !!e.data.enabled;
    }
  });

  const resolved = () => Promise.resolve();

  const origRequest = Element.prototype.requestFullscreen;
  const origWebkitRequest = Element.prototype.webkitRequestFullscreen;
  const origExit = Document.prototype.exitFullscreen;
  const origWebkitExit = Document.prototype.webkitExitFullscreen;

  Element.prototype.requestFullscreen = function (...args) {
    if (state.enabled) { fakeChange(); return resolved(); }
    return origRequest ? origRequest.apply(this, args) : resolved();
  };

  if (origWebkitRequest) {
    Element.prototype.webkitRequestFullscreen = function (...args) {
      if (state.enabled) { fakeChange(); return undefined; }
      return origWebkitRequest.apply(this, args);
    };
  }

  Document.prototype.exitFullscreen = function (...args) {
    if (state.enabled) return resolved();
    return origExit ? origExit.apply(this, args) : resolved();
  };

  if (origWebkitExit) {
    Document.prototype.webkitExitFullscreen = function (...args) {
      if (state.enabled) return undefined;
      return origWebkitExit.apply(this, args);
    };
  }

  // Make the game believe it is in fullscreen (non-null fullscreenElement).
  function defineFake(prop) {
    let orig;
    for (const proto of [Document.prototype, HTMLDocument.prototype]) {
      if (!proto) continue;
      const d = Object.getOwnPropertyDescriptor(proto, prop);
      if (d) { orig = d; break; }
    }
    try {
      Object.defineProperty(document, prop, {
        configurable: true,
        get() {
          if (state.enabled) return document.documentElement;
          return orig && orig.get ? orig.get.call(document) : null;
        }
      });
    } catch (_) { /* ignore */ }
  }
  defineFake('fullscreenElement');
  defineFake('webkitFullscreenElement');

  function fakeChange() {
    setTimeout(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    }, 0);
  }
})();
