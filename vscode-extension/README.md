# Shiba Track — Coding Tracker 🐕⌨️

Tracks how long you spend actively coding — per project, per file, and per
programming language — and sends it to your Shiba Track desktop app, where it
shows up under **Stats → Code**.

## How it works

- Only counts time while you're actually **typing** in a real file. Just
  having a file open and staring at it doesn't count.
- If you stop typing in a file for **5 minutes or more**, tracking for that
  file stops — even if it's still open — until you start typing again (in
  that file or a different one).
- Requires the Shiba Track desktop app to be running in the background. If
  it's not, this extension simply can't send anything — no data is lost
  server-side, it just isn't recorded, and it'll resume the moment the app is
  running again.

A small status bar item on the bottom-right shows the connection state:

- `✓ Shiba Track` — connected, heartbeats are getting through
- `⊘ Shiba Track` — the desktop app isn't reachable right now

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `shibaTrack.enabled` | `true` | Turn heartbeat sending off entirely. |
| `shibaTrack.port` | `51820` | Local port the Shiba Track app listens on. Only change this if you've changed it in the app too — it isn't currently user-configurable there, so leave this alone unless a future app version adds that. |

## Privacy

Everything stays on your machine — this only ever talks to
`http://127.0.0.1:<port>` (loopback only, never leaves your computer), and
only while the Shiba Track app is running locally.
