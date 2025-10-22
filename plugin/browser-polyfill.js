// Cross-browser compatibility
if (typeof browser === "undefined") {
  globalThis.browser = chrome; // chrome doesn't use `browser` so alias it
}
