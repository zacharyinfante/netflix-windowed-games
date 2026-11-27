// Runs in the PAGE's main world at document_start.
// Neutralizes the Fullscreen API so Netflix games stay windowed, while telling
// the game it IS fullscreen so it won't pause or re-prompt.
(() => {
  const w = window as unknown as { __NWG_INSTALLED?: boolean };
  if (w.__NWG_INSTALLED) return;
  w.__NWG_INSTALLED = true;

  const state = { enabled: true };

  // Receive the on/off flag from the extension (loader.ts, isolated world).
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data as { __nwg?: string; enabled?: boolean } | null;
    if (e.source === window && d && d.__nwg === "set") {
      state.enabled = !!d.enabled;
    }
  });

  const resolved = (): Promise<void> => Promise.resolve();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const proto = Element.prototype as any;
  const docProto = Document.prototype as any;

  const origRequest: ((...a: any[]) => Promise<void>) | undefined = proto.requestFullscreen;
  const origWebkitRequest: ((...a: any[]) => unknown) | undefined = proto.webkitRequestFullscreen;
  const origExit: ((...a: any[]) => Promise<void>) | undefined = docProto.exitFullscreen;
  const origWebkitExit: ((...a: any[]) => unknown) | undefined = docProto.webkitExitFullscreen;

  proto.requestFullscreen = function (this: Element, ...args: any[]): Promise<void> {
    if (state.enabled) { fakeChange(); return resolved(); }
    return origRequest ? origRequest.apply(this, args) : resolved();
  };

  if (origWebkitRequest) {
    proto.webkitRequestFullscreen = function (this: Element, ...args: any[]): unknown {
      if (state.enabled) { fakeChange(); return undefined; }
      return origWebkitRequest.apply(this, args);
    };
  }

  docProto.exitFullscreen = function (this: Document, ...args: any[]): Promise<void> {
    if (state.enabled) return resolved();
    return origExit ? origExit.apply(this, args) : resolved();
  };

  if (origWebkitExit) {
    docProto.webkitExitFullscreen = function (this: Document, ...args: any[]): unknown {
      if (state.enabled) return undefined;
      return origWebkitExit.apply(this, args);
    };
  }

  // Make the game believe it is in fullscreen (non-null fullscreenElement).
  function defineFake(prop: string): void {
    let orig: PropertyDescriptor | undefined;
    const htmlDocProto = (window as any).HTMLDocument?.prototype as object | undefined;
    for (const p of [Document.prototype as object, htmlDocProto]) {
      if (!p) continue;
      const d = Object.getOwnPropertyDescriptor(p, prop);
      if (d) { orig = d; break; }
    }
    try {
      Object.defineProperty(document, prop, {
        configurable: true,
        get(): Element | null {
          if (state.enabled) return document.documentElement;
          return orig && orig.get ? orig.get.call(document) : null;
        },
      });
    } catch {
      /* ignore */
    }
  }
  defineFake("fullscreenElement");
  defineFake("webkitFullscreenElement");

  function fakeChange(): void {
    setTimeout(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
      document.dispatchEvent(new Event("webkitfullscreenchange"));
    }, 0);
  }
})();
