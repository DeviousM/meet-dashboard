// Injects a Meet-styled "Home" button at the top center of Google Meet.
// Clicking it asks the service worker to reset the browser to the dashboard.

const BTN_ID = "meet-dashboard-reset-btn";

function ensureButton() {
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.title = "Reset to dashboard home screen";
  btn.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 3 4 9v12h6v-6h4v6h6V9z"/></svg><span>Home</span>';

  // Match Meet's control-bar buttons (#3c4043 pill, Google Sans, ~48px tall).
  Object.assign(btn.style, {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    height: "48px",
    padding: "0 22px",
    border: "none",
    borderRadius: "24px",
    background: "#3c4043",
    color: "#e8eaed",
    font: '500 15px/1 "Google Sans", Roboto, Arial, sans-serif',
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,.3)",
  });

  btn.addEventListener("mouseenter", () => (btn.style.background = "#494c50"));
  btn.addEventListener("mouseleave", () => (btn.style.background = "#3c4043"));
  btn.addEventListener("click", () =>
    chrome.runtime.sendMessage({ type: "reset-to-initial" })
  );

  document.body.appendChild(btn);
}

// Meet is an SPA that re-renders heavily; keep the button present.
ensureButton();
setInterval(ensureButton, 2000);
