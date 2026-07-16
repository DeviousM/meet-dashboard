# Meet Dashboard Reset — companion extension

Adds a Meet-styled **Home** button (top center) on `meet.google.com`. Clicking
it opens a fresh tab at the configured dashboard URL and closes every other tab
— returning a kiosk browser to its initial state.

## Load (unpacked)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this `extension/` folder.
3. Click the extension icon (or right-click → Options) to set the **dashboard
   home URL**. Defaults to `http://localhost:8337/`.

For a kiosk, load it via a Chrome policy / `--load-extension=` flag instead.

## Notes

- No build step, no dependencies — plain Manifest V3 files.
- The reset closes all tabs by design; there is no confirm prompt.
