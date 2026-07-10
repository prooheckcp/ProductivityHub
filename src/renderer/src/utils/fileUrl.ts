// A plain file:// URL would seem right here, but Chromium unconditionally blocks
// http(s)-origin pages (i.e. the electron-vite dev server) from loading file://
// resources, no matter what CSP says. The main process serves these paths over
// a custom "shiba-image" scheme instead (see main/localImageProtocol.ts), which
// isn't subject to that restriction and works identically in dev and packaged
// builds.
/** Converts an absolute filesystem path (mac or Windows) into a URL usable in <img src>. */
export function toFileUrl(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, '/')
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  return `shiba-image://local${encodeURI(withLeadingSlash)}`
}
