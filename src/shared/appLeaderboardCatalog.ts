// Curated catalogs for the app-usage leaderboards (Developer Tools & Games).
// Each item has a canonical display name and a set of aliases matched against
// the tracked app name. Only apps that match an item here are ranked.

export type LeaderboardCategory = 'code' | 'devtools' | 'games'

export type CatalogItem = { name: string; aliases: string[] }

export const DEV_TOOLS: CatalogItem[] = [
  { name: 'VS Code', aliases: ['visual studio code', 'vscode', 'vscodium', 'code', 'code - insiders'] },
  { name: 'Cursor', aliases: ['cursor'] },
  { name: 'Visual Studio', aliases: ['visual studio', 'devenv'] },
  { name: 'IntelliJ IDEA', aliases: ['intellij idea', 'intellij'] },
  { name: 'PyCharm', aliases: ['pycharm'] },
  { name: 'WebStorm', aliases: ['webstorm'] },
  { name: 'Rider', aliases: ['jetbrains rider', 'rider'] },
  { name: 'CLion', aliases: ['clion'] },
  { name: 'Android Studio', aliases: ['android studio'] },
  { name: 'Xcode', aliases: ['xcode'] },
  { name: 'Sublime Text', aliases: ['sublime text', 'sublime'] },
  { name: 'Neovim', aliases: ['neovim', 'nvim'] },
  { name: 'Notepad++', aliases: ['notepad++', 'notepad_plus_plus'] },
  { name: 'Eclipse', aliases: ['eclipse'] },
  { name: 'Unity', aliases: ['unity hub', 'unityhub', 'unity'] },
  { name: 'Unreal Engine', aliases: ['unreal engine', 'unrealeditor', 'unreal editor'] },
  { name: 'Godot', aliases: ['godot engine', 'godot'] },
  { name: 'Roblox Studio', aliases: ['roblox studio', 'robloxstudio'] },
  { name: 'GameMaker', aliases: ['gamemaker studio', 'gamemaker'] },
  { name: 'Blender', aliases: ['blender'] },
  { name: 'Docker', aliases: ['docker desktop', 'docker'] },
  { name: 'Postman', aliases: ['postman'] },
  { name: 'Figma', aliases: ['figma'] },
  { name: 'GitHub Desktop', aliases: ['github desktop'] },
  { name: 'Terminal', aliases: ['iterm2', 'iterm', 'warp', 'windows terminal', 'terminal'] }
]

export const GAMES: CatalogItem[] = [
  { name: 'League of Legends', aliases: ['league of legends', 'leagueclient', 'league'] },
  { name: 'Valorant', aliases: ['valorant'] },
  { name: 'Counter-Strike 2', aliases: ['counter-strike 2', 'counter-strike', 'cs2', 'csgo'] },
  { name: 'Minecraft', aliases: ['minecraft'] },
  { name: 'Fortnite', aliases: ['fortnite'] },
  { name: 'Dota 2', aliases: ['dota 2', 'dota2'] },
  { name: 'Overwatch 2', aliases: ['overwatch 2', 'overwatch'] },
  { name: 'Roblox', aliases: ['roblox'] },
  { name: 'Genshin Impact', aliases: ['genshin impact', 'genshin'] },
  { name: 'Apex Legends', aliases: ['apex legends'] },
  { name: 'Grand Theft Auto V', aliases: ['grand theft auto v', 'grand theft auto', 'gta v', 'gtav', 'gta5'] },
  { name: 'Call of Duty', aliases: ['call of duty', 'modern warfare', 'warzone'] },
  { name: 'World of Warcraft', aliases: ['world of warcraft'] },
  { name: 'Elden Ring', aliases: ['elden ring'] },
  { name: 'The Sims 4', aliases: ['the sims 4', 'the sims'] },
  { name: 'Rocket League', aliases: ['rocket league'] },
  { name: 'Among Us', aliases: ['among us'] },
  { name: 'Steam', aliases: ['steam'] }
]

type Match = { category: Exclude<LeaderboardCategory, 'code'>; item: string }

// Exact-alias lookup (fast path). Built once.
const EXACT: Map<string, Match> = new Map()
for (const t of DEV_TOOLS) for (const a of t.aliases) if (!EXACT.has(a)) EXACT.set(a, { category: 'devtools', item: t.name })
for (const g of GAMES) for (const a of g.aliases) if (!EXACT.has(a)) EXACT.set(a, { category: 'games', item: g.name })

// Map a tracked app name to a catalog item, or null if it's not one we rank.
// Dev tools are checked before games (so "Roblox Studio" → tool, not "Roblox").
export function matchAppToItem(appName: string | null | undefined): Match | null {
  if (!appName) return null
  const name = appName.trim().toLowerCase()
  if (!name) return null

  const exact = EXACT.get(name)
  if (exact) return exact

  // Substring fallback, but only for reasonably long aliases to avoid short
  // false positives (e.g. "code" inside "xcode"). Dev tools first.
  for (const t of DEV_TOOLS) {
    for (const a of t.aliases) {
      if (a.length >= 5 && name.includes(a)) return { category: 'devtools', item: t.name }
    }
  }
  for (const g of GAMES) {
    for (const a of g.aliases) {
      if (a.length >= 5 && name.includes(a)) return { category: 'games', item: g.name }
    }
  }
  return null
}
