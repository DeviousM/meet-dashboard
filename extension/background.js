// Service worker: performs the actual "reset to initial state".
// Content scripts can't touch chrome.tabs, so the button messages us here.

const DEFAULT_URL = "http://localhost:8337/";

chrome.runtime.onInstalled.addListener(async () => {
  const { initialUrl } = await chrome.storage.sync.get("initialUrl");
  if (!initialUrl) await chrome.storage.sync.set({ initialUrl: DEFAULT_URL });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "reset-to-initial") resetBrowser();
});

// Open one fresh tab at the configured home screen, then close everything
// else. This clears any live meeting + leftover tabs = true initial state.
async function resetBrowser() {
  const { initialUrl } = await chrome.storage.sync.get("initialUrl");
  const url = initialUrl || DEFAULT_URL;
  const fresh = await chrome.tabs.create({ url });
  const others = (await chrome.tabs.query({}))
    .filter((t) => t.id !== fresh.id && t.id !== undefined)
    .map((t) => t.id);
  if (others.length) await chrome.tabs.remove(others);
}
