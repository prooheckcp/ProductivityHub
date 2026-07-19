import p1 from './avatars/profile-1.png'
import p2 from './avatars/profile-2.png'
import p3 from './avatars/profile-3.png'
import p4 from './avatars/profile-4.png'
import p5 from './avatars/profile-5.png'
import p6 from './avatars/profile-6.png'

// The six built-in profile-picture templates. Stored on a profile as a token
// like "template:2" (an index into this array) instead of an uploaded URL, so
// no upload is needed and every client resolves it to the same bundled image.
export const AVATAR_TEMPLATES: string[] = [p1, p2, p3, p4, p5, p6]

const TEMPLATE_PREFIX = 'template:'

export function templateToken(index: number): string {
  return `${TEMPLATE_PREFIX}${index}`
}

export function isTemplateToken(value: string | null): boolean {
  return !!value && value.startsWith(TEMPLATE_PREFIX)
}

export function templateIndex(value: string | null): number | null {
  if (!isTemplateToken(value)) return null
  const idx = parseInt((value as string).slice(TEMPLATE_PREFIX.length), 10)
  return Number.isFinite(idx) ? idx : null
}

// Turn a stored avatar value into a displayable image URL. Handles both template
// tokens and real uploaded URLs; returns null when there's nothing to show.
export function resolveAvatar(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null
  const idx = templateIndex(avatarUrl)
  if (idx !== null) return AVATAR_TEMPLATES[idx] ?? AVATAR_TEMPLATES[0]
  return avatarUrl
}

export function randomTemplateToken(): string {
  return templateToken(Math.floor(Math.random() * AVATAR_TEMPLATES.length))
}
