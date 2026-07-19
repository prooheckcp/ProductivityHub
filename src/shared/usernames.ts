// Fun random usernames assigned when a new account is created (the user can
// change theirs anytime in Settings).

const ADJECTIVES = [
  'Swift', 'Brave', 'Cosmic', 'Turbo', 'Mighty', 'Sneaky', 'Lucky', 'Clever',
  'Fuzzy', 'Neon', 'Pixel', 'Rapid', 'Silent', 'Golden', 'Wild', 'Sunny',
  'Frosty', 'Zesty', 'Nimble', 'Bold'
]

const NOUNS = [
  'Shiba', 'Coder', 'Ninja', 'Panda', 'Falcon', 'Otter', 'Dragon', 'Fox',
  'Wolf', 'Byte', 'Tiger', 'Comet', 'Raccoon', 'Hawk', 'Yeti', 'Koala',
  'Phoenix', 'Lynx', 'Badger', 'Puffin'
]

export function randomUsername(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${a}${n}${num}`
}
