import { net, protocol } from 'electron'
import { pathToFileURL } from 'url'

// Renderer pages loaded from the electron-vite dev server are served over
// http://localhost, and Chromium unconditionally blocks http(s) pages from
// loading file:// resources — no CSP setting can override that. Only the
// packaged build (loaded via loadFile → file:// origin) escaped this, which
// is why picture uploads looked fine before but silently no-op in dev. A
// custom scheme registered as "standard/secure/corsEnabled" sidesteps the
// restriction entirely, so it works the same way in dev and packaged builds.
export const LOCAL_IMAGE_SCHEME = 'shiba-image'

// Must run before app.whenReady(), so this is called at module scope from
// main/index.ts (which imports this file at the top, ahead of whenReady).
protocol.registerSchemesAsPrivileged([
  {
    scheme: LOCAL_IMAGE_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
  }
])

export function registerLocalImageProtocol(): void {
  protocol.handle(LOCAL_IMAGE_SCHEME, (request) => {
    const url = new URL(request.url)
    const absolutePath = decodeURIComponent(url.pathname)
    return net.fetch(pathToFileURL(absolutePath).toString())
  })
}
