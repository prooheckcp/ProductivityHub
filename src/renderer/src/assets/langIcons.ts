// Bundled programming-language icons (from Images/programming_languages).
// Loaded via Vite's glob import so adding a PNG to assets/languages is enough.
const modules = import.meta.glob('./languages/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>

// filename (without extension, lowercased) -> bundled URL
const byFile: Record<string, string> = {}
for (const [path, url] of Object.entries(modules)) {
  const file = path.split('/').pop()?.replace('.png', '').toLowerCase()
  if (file) byFile[file] = url
}

// Display language name (as stored on coding sessions) -> icon filename.
const NAME_TO_FILE: Record<string, string> = {
  'C++': 'c++',
  C: 'c',
  'C#': 'csharp',
  Dart: 'dart',
  Go: 'go',
  HTML: 'html',
  Java: 'java',
  JSON: 'json',
  Kotlin: 'kotlin',
  Lua: 'lua',
  Luau: 'luau',
  Markdown: 'markdown',
  Perl: 'perl',
  PHP: 'php',
  Python: 'python',
  Ruby: 'ruby',
  Rust: 'rust',
  Scala: 'scala',
  TOML: 'toml',
  TypeScript: 'typescript'
}

// Returns the icon URL for a language, or null if we don't have one bundled.
export function languageIcon(language: string): string | null {
  const mapped = NAME_TO_FILE[language]
  if (mapped && byFile[mapped]) return byFile[mapped]
  const direct = byFile[language.toLowerCase()]
  return direct ?? null
}
