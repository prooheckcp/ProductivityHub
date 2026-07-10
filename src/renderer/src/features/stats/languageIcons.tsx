import type { JSX } from 'react'
import { CodeIcon } from '../../components/icons'

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

const LANGUAGE_ICONS: Record<string, LanguageIcon> = {
  javascript: makeBadge('JS', '#f0db4f', '#1a1a1a'),
  javascriptreact: makeBadge('JSX', '#61dafb', '#1a1a1a'),
  typescript: makeBadge('TS', '#3178c6'),
  typescriptreact: makeBadge('TSX', '#3178c6'),
  python: makeBadge('PY', '#3776ab'),
  java: makeBadge('JAVA', '#ea2d2e'),
  c: makeBadge('C', '#5c6bc0'),
  cpp: makeBadge('C++', '#00599c'),
  csharp: makeBadge('C#', '#68217a'),
  go: makeBadge('GO', '#00acd7', '#1a1a1a'),
  rust: makeBadge('RS', '#dea584', '#1a1a1a'),
  ruby: makeBadge('RB', '#cc342d'),
  php: makeBadge('PHP', '#777bb4'),
  swift: makeBadge('SW', '#f05138'),
  kotlin: makeBadge('KT', '#7f52ff'),
  dart: makeBadge('DART', '#0175c2'),
  html: makeBadge('HTML', '#e34f26'),
  css: makeBadge('CSS', '#264de4'),
  scss: makeBadge('SCSS', '#cc6699'),
  less: makeBadge('LESS', '#1d365d'),
  json: makeBadge('JSON', '#8a8a8a', '#1a1a1a'),
  jsonc: makeBadge('JSON', '#8a8a8a', '#1a1a1a'),
  yaml: makeBadge('YML', '#cb171e'),
  markdown: makeBadge('MD', '#083fa1'),
  shellscript: makeBadge('SH', '#4eaa25'),
  sql: makeBadge('SQL', '#e38c00', '#1a1a1a'),
  vue: makeBadge('VUE', '#41b883'),
  xml: makeBadge('XML', '#ff6600'),
  dockerfile: makeBadge('DKR', '#2496ed'),
  lua: makeBadge('LUA', '#00008b'),
  perl: makeBadge('PL', '#39457e'),
  r: makeBadge('R', '#276dc3'),
  scala: makeBadge('SC', '#dc322f'),
  haskell: makeBadge('HS', '#5e5086'),
  elixir: makeBadge('EX', '#4b275f'),
  clojure: makeBadge('CLJ', '#5881d8', '#1a1a1a'),
  powershell: makeBadge('PS1', '#012456'),
  'objective-c': makeBadge('OBJC', '#438eff', '#1a1a1a'),
  plaintext: makeBadge('TXT', '#9e9e9e', '#1a1a1a')
}

export function getLanguageIcon(language: string): LanguageIcon {
  return LANGUAGE_ICONS[language.toLowerCase()] ?? CodeIcon
}
