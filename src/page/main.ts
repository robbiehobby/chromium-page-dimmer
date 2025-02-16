import { Settings, defaultSettings, Overlay, Tab } from "../js/defaults.ts";

const el = {
  alert: document.getElementById("alert") as HTMLDivElement,
  form: document.getElementById("form") as HTMLFormElement,
  enabled: document.querySelector('input[name="enabled"]') as HTMLInputElement,
  enabledLabel: document.getElementById("enabledLabel") as HTMLLabelElement,
  global: document.querySelector('input[name="global"]') as HTMLInputElement,
  brightness: document.querySelector('input[name="brightness"]') as HTMLInputElement,
  contrast: document.querySelector('input[name="contrast"]') as HTMLInputElement,
  sepia: document.querySelector('input[name="sepia"]') as HTMLInputElement,
  grayscale: document.querySelector('input[name="grayscale"]') as HTMLInputElement,
  shortcut: document.getElementById("shortcut") as HTMLButtonElement,
  resetTab: document.getElementById("resetTab") as HTMLButtonElement,
  resetAll: document.getElementById("resetAll") as HTMLButtonElement,
};

function showPage(status = true) {
  if (!status) el.form.remove();
  else el.alert.remove();
  document.body.classList.remove("hidden");
}

function updateEnabledLabel(enabled = false) {
  if (enabled) el.enabledLabel.innerText = chrome.i18n.getMessage("6C22C815681D");
  else el.enabledLabel.innerText = chrome.i18n.getMessage("2BE81B5A153F");
}

function getValues(): Settings {
  const settings = structuredClone(defaultSettings);
  const data = new FormData(el.form);

  settings.enabled = el.enabled.checked;
  settings.global = el.global.checked;
  settings.overlay.brightness = String(data.get("brightness"));
  settings.overlay.contrast = String(data.get("contrast"));
  settings.overlay.sepia = String(data.get("sepia"));
  settings.overlay.grayscale = String(data.get("grayscale"));

  updateEnabledLabel(settings.enabled);
  return settings;
}

function setValues(settings: Settings) {
  chrome.runtime.sendMessage({ type: "log", payload: [settings] });

  el.enabled.checked = settings.enabled;
  el.global.checked = settings.global;
  el.brightness.value = settings.overlay.brightness;
  el.contrast.value = settings.overlay.contrast;
  el.sepia.value = settings.overlay.sepia;
  el.grayscale.value = settings.overlay.grayscale;

  updateEnabledLabel(settings.enabled);
  showPage();
}

function App(tab: Tab, settings: Settings) {
  async function saveSettings() {
    await chrome.runtime.sendMessage({ type: "saveTabSettings", payload: [tab, getValues()] });
  }

  async function toggleGlobalSettings(enabled = false) {
    const values = getValues();
    if (enabled) {
      chrome.runtime.sendMessage({ type: "getGlobalSettings" }, (globalSettings: Overlay) => {
        setValues({ ...values, ...{ overlay: { ...globalSettings } } });
        saveSettings();
      });
    } else {
      chrome.runtime.sendMessage({ type: "getTabSettings", payload: [tab, true] }, (tabSettings: Settings) => {
        setValues({ ...tabSettings, ...{ global: false } });
        saveSettings();
      });
    }
  }

  document.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    if (input.name === "global") input.addEventListener("change", () => toggleGlobalSettings(input.checked));
    else input.addEventListener("change", saveSettings);
  });

  // Reset settings.
  el.resetTab.addEventListener("click", () => {
    if (window.confirm(chrome.i18n.getMessage("871A08C3AEDD"))) {
      chrome.runtime.sendMessage({ type: "resetSettings", payload: [tab] }, () => window.location.reload());
    }
  });
  el.resetAll.addEventListener("click", () => {
    if (window.confirm(chrome.i18n.getMessage("510764E09AD0"))) {
      chrome.runtime.sendMessage({ type: "resetSettings", payload: [tab, true] }, () => window.location.reload());
    }
  });

  // Set initial settings.
  if (settings) setValues(settings);
  else toggleGlobalSettings(true);
}

// Load the settings before initializing the app.
chrome.runtime.sendMessage({ type: "getTab" }, (tab: Tab) => {
  chrome.runtime.sendMessage({ type: "isScriptableTab", payload: [tab] }, (scriptable: boolean) => {
    if (!scriptable) return showPage(false);
    chrome.runtime.sendMessage({ type: "getTabSettings", payload: [tab] }, (settings: Settings) => {
      App(tab, settings);
    });
  });
});

// Open extension shortcuts page in a new tab.
el.shortcut.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
