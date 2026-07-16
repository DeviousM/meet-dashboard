const urlInput = document.getElementById("url");
const status = document.getElementById("status");

chrome.storage.sync.get("initialUrl").then(({ initialUrl }) => {
  if (initialUrl) urlInput.value = initialUrl;
});

function show(msg, isError) {
  status.textContent = msg;
  status.className = isError ? "error" : "";
  if (!isError) setTimeout(() => (status.textContent = ""), 1500);
}

document.getElementById("save").addEventListener("click", async () => {
  const value = urlInput.value.trim();
  try {
    new URL(value); // reject anything that isn't a real URL
  } catch {
    show("Enter a valid URL (e.g. http://localhost:8337/)", true);
    return;
  }
  await chrome.storage.sync.set({ initialUrl: value });
  show("Saved");
});
