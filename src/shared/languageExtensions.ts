// Maps file extensions to a canonical display language name. VS Code's own
// `languageId` already covers mainstream languages, but obscure/newer ones
// (e.g. Luau) can come through as 'plaintext' or a third-party-extension-
// specific id, so we resolve from the file extension first and only fall
// back to whatever languageId the editor reported.
export const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: 'TypeScript',
  mts: 'TypeScript',
  cts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  jsx: 'JavaScript',
  py: 'Python',
  pyw: 'Python',
  pyi: 'Python',
  java: 'Java',
  c: 'C',
  h: 'C',
  cpp: 'C++',
  cc: 'C++',
  cxx: 'C++',
  hpp: 'C++',
  hh: 'C++',
  hxx: 'C++',
  cs: 'C#',
  go: 'Go',
  rs: 'Rust',
  rb: 'Ruby',
  erb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
  kts: 'Kotlin',
  dart: 'Dart',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  json: 'JSON',
  jsonc: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  md: 'Markdown',
  markdown: 'Markdown',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  sql: 'SQL',
  vue: 'Vue',
  xml: 'XML',
  lua: 'Lua',
  luau: 'Luau',
  pl: 'Perl',
  pm: 'Perl',
  r: 'R',
  scala: 'Scala',
  sc: 'Scala',
  hs: 'Haskell',
  ex: 'Elixir',
  exs: 'Elixir',
  clj: 'Clojure',
  cljc: 'Clojure',
  cljs: 'ClojureScript',
  ps1: 'PowerShell',
  psm1: 'PowerShell',
  m: 'Objective-C',
  mm: 'Objective-C++',
  toml: 'TOML',
  ini: 'INI',
  bat: 'Batch',
  cmd: 'Batch',
  gradle: 'Gradle',
  groovy: 'Groovy',
  vb: 'Visual Basic',
  fs: 'F#',
  fsx: 'F#',
  elm: 'Elm',
  erl: 'Erlang',
  hrl: 'Erlang',
  jl: 'Julia',
  nim: 'Nim',
  zig: 'Zig',
  proto: 'Protocol Buffers',
  graphql: 'GraphQL',
  gql: 'GraphQL',
  tf: 'Terraform',
  svelte: 'Svelte',
  astro: 'Astro'
}

// The canonical languages we actually track (the values of the extension map).
// Coding time for anything else (unknown extensions that fell back to the
// editor's languageId, 'Other', 'Plain Text', etc.) is excluded from Stats and
// the leaderboards.
export const TRACKED_LANGUAGES: ReadonlySet<string> = new Set(Object.values(EXTENSION_LANGUAGE_MAP))

export function isTrackedLanguage(language: string): boolean {
  return TRACKED_LANGUAGES.has(language)
}

function extensionOf(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName
  if (base.toLowerCase() === 'dockerfile') return 'dockerfile'
  const dotIndex = base.lastIndexOf('.')
  if (dotIndex <= 0) return ''
  return base.slice(dotIndex + 1).toLowerCase()
}

function titleCase(value: string): string {
  return value.length === 0 ? 'Other' : value[0].toUpperCase() + value.slice(1)
}

/** Canonical display language for a file, preferring the extension map and
 * falling back to whatever languageId the editor reported (or 'Other'). */
export function languageForFile(fileName: string, fallbackLanguageId?: string): string {
  const ext = extensionOf(fileName)
  if (ext === 'dockerfile') return 'Dockerfile'
  const mapped = EXTENSION_LANGUAGE_MAP[ext]
  if (mapped) return mapped
  if (fallbackLanguageId) return titleCase(fallbackLanguageId)
  return 'Other'
}
