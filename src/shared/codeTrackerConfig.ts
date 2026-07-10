// Shared between the app and the VS Code extension (which can't import this
// file directly, being a separate npm package) — keep the two in sync by hand
// if this ever changes; see vscode-extension/README.md.
export const DEFAULT_CODE_TRACKER_PORT = 51820

// If no heartbeat has arrived in this long, the extension is treated as "not
// currently connected" (uninstalled, VS Code closed, etc.) rather than just
// idle — used both by Settings' status row and the Stats > Code install card.
export const CODE_TRACKER_CONNECTED_WINDOW_MS = 5 * 60 * 1000

export const CODE_TRACKER_MARKETPLACE_URL =
  'https://marketplace.visualstudio.com/items?itemName=VascoSoares.shiba-track-coding-tracker'
