document.querySelectorAll<HTMLElement>("[data-text], [aria-label]").forEach((element) => {
  let uuid = element.dataset.text || null;
  if (!uuid) uuid = element.ariaLabel;
  if (!uuid) return;

  const message = chrome.i18n.getMessage(String(uuid));
  if (element.dataset.text) {
    element.innerText = message;
    delete element.dataset.text;
  } else element.ariaLabel = message;
});
