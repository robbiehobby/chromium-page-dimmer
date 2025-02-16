import { Settings, Tab } from "./defaults.ts";

(function () {
  let started = false;
  let el: HTMLElement | null = document.querySelector("page-dimmer");

  // Create the page dimmer el when the page loads.
  if (!el) {
    el = document.createElement("page-dimmer") as HTMLElement;
    if (localStorage.getItem("page-dimmer-enabled") !== "1") {
      el.style.opacity = "0";
      el.style.visibility = "hidden";
    }
    el.style.position = "fixed";
    el.style.zIndex = "2147483647";
    el.style.inset = "0";
    el.style.pointerEvents = "none";
    el.style.backdropFilter = localStorage.getItem("page-dimmer-settings") || "";
    document.documentElement.appendChild(el);
  }

  function App(settings: Settings) {
    if (!el) return;

    const filters: string[] = [];
    if (settings.enabled && settings.overlay) {
      filters.push(`brightness(${settings.overlay.brightness})`);
      filters.push(`contrast(${settings.overlay.contrast})`);
      filters.push(`sepia(${settings.overlay.sepia})`);
      filters.push(`grayscale(${settings.overlay.grayscale})`);
    }
    el.style.backdropFilter = filters.join(" ");
    el.style.opacity = settings.enabled ? "1" : "0";
    el.style.visibility = settings.enabled ? "visible" : "hidden";

    // Remember the status and settings of the page dimmer to minimize flicker
    // when the page is refreshed, revisited, or when the URL changes.
    localStorage.setItem("page-dimmer-enabled", settings.enabled ? "1" : "0");
    localStorage.setItem("page-dimmer-settings", el.style.backdropFilter);

    if (!started) {
      setTimeout(() => {
        el.style.transition = "all";
        el.style.transitionDuration = "0.3s";
        el.style.transitionTimingFunction = "ease";
      });
      started = true;
    }
  }

  chrome.runtime.sendMessage({ type: "getTab" }, (tab: Tab) =>
    chrome.runtime.sendMessage({ type: "getTabSettings", payload: [tab] }, (settings: Settings) => {
      App(settings);
    }),
  );
})();
