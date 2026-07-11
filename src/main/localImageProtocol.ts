import { protocol } from 'electron'
import { existsSync, readFileSync, statSync } from 'fs'
import { extname } from 'path'

// Renderer pages loaded from the electron-vite dev server are served over
// http://localhost, and Chromium unconditionally blocks http(s) pages from
// loading file:// resources — no CSP setting can override that. A custom scheme
// registered as "standard/secure/corsEnabled" sidesteps the restriction, so it
// works the same way in dev and packaged builds.
export const LOCAL_IMAGE_SCHEME = 'shiba-image'

// Must run before app.whenReady(), so this is called at module scope from
// main/index.ts (which imports this file at the top, ahead of whenReady).
protocol.registerSchemesAsPrivileged([
  {
    scheme: LOCAL_IMAGE_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
  }
])

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf'
}

function contentTypeFor(path: string): string {
  return CONTENT_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream'
}

export function registerLocalImageProtocol(): void {
  protocol.handle(LOCAL_IMAGE_SCHEME, (request) => {
    const url = new URL(request.url)
    const absolutePath = decodeURIComponent(url.pathname)

    if (!existsSync(absolutePath)) {
      return new Response('Not found', { status: 404 })
    }

    const size = statSync(absolutePath).size
    const contentType = contentTypeFor(absolutePath)
    const file = readFileSync(absolutePath)

    // Chromium's embedded PDF viewer issues Range requests and fails without
    // proper 206 responses — earlier this only surfaced once a second resource
    // (an image) also loaded through this handler. Serve real ranges so images
    // and PDFs coexist in the same note.
    const range = request.headers.get('Range')
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range)
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0
        const end = match[2] ? parseInt(match[2], 10) : size - 1
        const clampedEnd = Math.min(end, size - 1)
        if (start <= clampedEnd) {
          const chunk = file.subarray(start, clampedEnd + 1)
          return new Response(chunk, {
            status: 206,
            headers: {
              'Content-Type': contentType,
              'Content-Range': `bytes ${start}-${clampedEnd}/${size}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunk.byteLength)
            }
          })
        }
      }
    }

    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(size)
      }
    })
  })
}
