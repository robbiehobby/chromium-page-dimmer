export type Tab = chrome.tabs.Tab | undefined;

export const defaultOverlaySettings = {
  brightness: "0.5",
  contrast: "1",
  sepia: "0",
  grayscale: "0",
};
export type Overlay = typeof defaultOverlaySettings;

export const defaultSettings = {
  enabled: false,
  global: true,
  overlay: defaultOverlaySettings,
};
export type Settings = typeof defaultSettings;
