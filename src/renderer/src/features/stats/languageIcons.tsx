import type { JSX } from 'react'
import { CodeIcon } from '../../components/icons'
import { languageIcon as pngLanguageIcon } from '../../assets/langIcons'

type LanguageBadgeProps = { size?: number }
type LanguageIcon = (props: LanguageBadgeProps) => JSX.Element

// Simplified colored badges, not official brand logos (no way to fetch/ship
// real logo assets here) — swap these for real logo files later by replacing
// this map's values with <img> components; every call site just renders
// whatever getLanguageIcon() returns.
function makeBadge(label: string, bg: string, fg: string = '#ffffff'): LanguageIcon {
  return function LanguageBadge({ size = 18 }: LanguageBadgeProps): JSX.Element {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <rect x="1" y="1" width="22" height="22" rx="5" fill={bg} />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize={label.length > 3 ? 6.5 : label.length > 2 ? 7.5 : 10}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          fill={fg}
        >
          {label}
        </text>
      </svg>
    )
  }
}

// Keys are the canonical display names produced by `languageForFile`
// (src/shared/languageExtensions.ts), not raw VS Code languageIds.
const LANGUAGE_ICONS: Record<string, LanguageIcon> = {
  JavaScript: makeBadge('JS', '#f0db4f', '#1a1a1a'),
  TypeScript: makeBadge('TS', '#3178c6'),
  Python: makeBadge('PY', '#3776ab'),
  Java: makeBadge('JAVA', '#ea2d2e'),
  C: makeBadge('C', '#5c6bc0'),
  'C++': makeBadge('C++', '#00599c'),
  'C#': makeBadge('C#', '#68217a'),
  Go: makeBadge('GO', '#00acd7', '#1a1a1a'),
  Rust: makeBadge('RS', '#dea584', '#1a1a1a'),
  Ruby: makeBadge('RB', '#cc342d'),
  PHP: makeBadge('PHP', '#777bb4'),
  Swift: makeBadge('SW', '#f05138'),
  Kotlin: makeBadge('KT', '#7f52ff'),
  Dart: makeBadge('DART', '#0175c2'),
  HTML: makeBadge('HTML', '#e34f26'),
  CSS: makeBadge('CSS', '#264de4'),
  SCSS: makeBadge('SCSS', '#cc6699'),
  Sass: makeBadge('SASS', '#cf649a'),
  Less: makeBadge('LESS', '#1d365d'),
  JSON: makeBadge('JSON', '#8a8a8a', '#1a1a1a'),
  YAML: makeBadge('YML', '#cb171e'),
  Markdown: makeBadge('MD', '#083fa1'),
  Shell: makeBadge('SH', '#4eaa25'),
  SQL: makeBadge('SQL', '#e38c00', '#1a1a1a'),
  Vue: makeBadge('VUE', '#41b883'),
  XML: makeBadge('XML', '#ff6600'),
  Dockerfile: makeBadge('DKR', '#2496ed'),
  Lua: makeBadge('LUA', '#00008b'),
  Luau: makeBadge('LUAU', '#00a2ff', '#1a1a1a'),
  Perl: makeBadge('PL', '#39457e'),
  R: makeBadge('R', '#276dc3'),
  Scala: makeBadge('SC', '#dc322f'),
  Haskell: makeBadge('HS', '#5e5086'),
  Elixir: makeBadge('EX', '#4b275f'),
  Clojure: makeBadge('CLJ', '#5881d8', '#1a1a1a'),
  ClojureScript: makeBadge('CLJS', '#5881d8', '#1a1a1a'),
  PowerShell: makeBadge('PS1', '#012456'),
  'Objective-C': makeBadge('OBJC', '#438eff', '#1a1a1a'),
  'Objective-C++': makeBadge('OBJC', '#438eff', '#1a1a1a'),
  TOML: makeBadge('TOML', '#9c4221'),
  INI: makeBadge('INI', '#6d6d6d'),
  Batch: makeBadge('BAT', '#4d4d4d'),
  Gradle: makeBadge('GRDL', '#02303a'),
  Groovy: makeBadge('GRVY', '#4298b8', '#1a1a1a'),
  'Visual Basic': makeBadge('VB', '#945db7'),
  'F#': makeBadge('F#', '#378bba'),
  Elm: makeBadge('ELM', '#1293d8', '#1a1a1a'),
  Erlang: makeBadge('ERL', '#a90533'),
  Julia: makeBadge('JL', '#9558b2'),
  Nim: makeBadge('NIM', '#ffc200', '#1a1a1a'),
  Zig: makeBadge('ZIG', '#f7a41d', '#1a1a1a'),
  'Protocol Buffers': makeBadge('PROTO', '#4285f4'),
  GraphQL: makeBadge('GQL', '#e10098'),
  Terraform: makeBadge('TF', '#7b42bc'),
  Svelte: makeBadge('SV', '#ff3e00'),
  Astro: makeBadge('AST', '#ff5d01', '#1a1a1a'),
  'Plain Text': makeBadge('TXT', '#9e9e9e', '#1a1a1a'),
  Other: makeBadge('?', '#9e9e9e', '#1a1a1a')
}

export function getLanguageIcon(language: string): LanguageIcon {
  // Prefer a real bundled PNG logo (Images/programming_languages) when we have
  // one; fall back to the colored letter badge, then the generic code icon.
  const png = pngLanguageIcon(language)
  if (png) {
    return function LanguagePngIcon({ size = 18 }: LanguageBadgeProps): JSX.Element {
      return <img src={png} width={size} height={size} alt="" style={{ objectFit: 'contain', borderRadius: 4 }} />
    }
  }
  return LANGUAGE_ICONS[language] ?? CodeIcon
}
