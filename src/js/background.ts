import { defaultOverlaySettings, defaultSettings, Overlay, Settings, Tab } from "./defaults.ts";

async function getGlobalSettings(): Promise<Overlay> {
  return (await chrome.storage.local.get(["_global"]))._global;
}

async function setGlobalSettings() {
  return chrome.storage.local.set({ _global: structuredClone(defaultOverlaySettings) });
}

// Set global settings when the extension is first installed.
chrome.runtime.onInstalled.addListener(() => {
  getGlobalSettings().then((settings) => {
    if (!settings) setGlobalSettings();
  });
});

function getHostname(tab: Tab) {
  if (!tab?.url) return false;
  try {
    const url = new URL(tab.url);
    return url.hostname;
  } catch (_e) {
    return false;
  }
}

async function updateIcon(enabled = false) {
  const path: Record<string, string> = {};
  [16, 32, 48, 128].forEach((size) => {
    path[size] = `../assets/${enabled ? "icon" : "inactive"}${size}.png`;
  });
  await chrome.action.setIcon({ path });
}

// Execute content script on a tab.
function executeScript(tab: Tab) {
  if (!tab?.id) return Promise.resolve(null);
  return chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["public/js/content.js"] });
}

// Get a tabs settings.
async function getSettings(tab: Tab, raw = false): Promise<Settings> {
  let settings = structuredClone(defaultSettings);
  const hostname = getHostname(tab);
  if (!hostname) return settings;

  const result = await chrome.storage.local.get([hostname]);
  if (result[hostname]) settings = result[hostname] as Settings;

  // Replace tab settings with global settings.
  if (settings.global && !raw) {
    const { _global } = await chrome.storage.local.get(["_global"]);
    settings.overlay = _global;
  }

  return settings;
}

async function saveSettings(tab: Tab, settings: Settings, raw = false) {
  const hostname = getHostname(tab);
  if (!hostname) return;

  if (settings.global && !raw) {
    await chrome.storage.local.set({ _global: settings.overlay });
    const tabSettings = await getSettings(tab, true);
    settings.overlay = tabSettings.overlay;
  }

  chrome.storage.local.set({ [hostname]: settings }, () => {
    executeScript(tab).then(() => updateIcon(settings.enabled));
  });
}

// Reset settings of all tabs.
async function resetSettings(tab: Tab, global: boolean = false) {
  if (global) {
    await chrome.storage.local.clear();
    await setGlobalSettings();
  } else {
    const hostname = getHostname(tab);
    if (hostname) await chrome.storage.local.set({ [hostname]: defaultSettings });
  }
  if (tab) executeScript(tab).then(() => updateIcon(false));
}

// Test ability to run content scripts on a tab.
async function isScriptableTab(tab: Tab) {
  if (!tab?.id) return false;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => true,
    });
  } catch (_e) {
    return false;
  }
  return true;
}

// Handle message commands from content scripts.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false;
  const { payload } = message;

  switch (message.type) {
    case "getTab":
      chrome.tabs.query({ active: true }, (tabs) => sendResponse(tabs[0]));
      return true;
    case "isScriptableTab":
      isScriptableTab(...(payload as [Tab])).then((a) => sendResponse(a));
      return true;
    case "getGlobalSettings":
      getGlobalSettings().then((r) => sendResponse(r));
      return true;
    case "getTabSettings":
      getSettings(...(payload as [Tab, boolean])).then((a) => sendResponse(a));
      return true;
    case "saveTabSettings":
      saveSettings(...(payload as [Tab, Settings, boolean])).then((a) => sendResponse(a));
      return true;
    case "resetSettings":
      resetSettings(...(payload as [Tab, boolean | undefined])).then(() => sendResponse());
      return true;
  }
});

// Handle tab changes.
async function onChange(tab: Tab, activated = false) {
  if (!(await isScriptableTab(tab))) return updateIcon(false);
  const tabSettings = await getSettings(tab, true);
  if (activated) await saveSettings(tab, { ...tabSettings, enabled: !tabSettings.enabled }, true);
  else executeScript(tab).then(() => updateIcon(tabSettings.enabled));
}

// Watch for toggle command.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-dimmer") onChange(tab, true);
});

// Watch for active tab changes.
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (activeInfo.tabId) chrome.tabs.get(activeInfo.tabId).then((t) => onChange(t));
});

// Watch for URL changes.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) chrome.tabs.get(tabId).then((t) => onChange(t));
});
