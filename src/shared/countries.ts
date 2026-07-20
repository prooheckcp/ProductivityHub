// ISO 3166-1 alpha-2 country codes + display names, used for the profile country
// selector and the leaderboard country filter. Flags are derived from the code
// at render time (regional-indicator letters), so we only store code + name.

export type Country = { code: string; name: string }

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Türkiye' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VN', name: 'Vietnam' }
]

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))

export function countryName(code: string | null): string {
  if (!code) return 'Unknown'
  return COUNTRY_BY_CODE.get(code)?.name ?? code
}

// Turn "US" into 🇺🇸 via regional-indicator symbols.
export function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return '🏳️'
  const base = 0x1f1e6
  const cc = code.toUpperCase()
  return String.fromCodePoint(base + (cc.charCodeAt(0) - 65), base + (cc.charCodeAt(1) - 65))
}

// Best-effort default from the OS locale, e.g. "en-US" → "US". Returns null if
// no region is present so the user can pick manually.
export function detectCountryCode(): string | null {
  try {
    const locale = new Intl.Locale(navigator.language)
    const region = locale.region ?? navigator.language.split('-')[1]?.toUpperCase()
    if (region && COUNTRY_BY_CODE.has(region)) return region
  } catch {
    // ignore
  }
  return null
}

// IP-based country lookup (no API key). Used as a fallback the first time an
// account is created when the OS locale doesn't reveal a region.
export async function fetchCountryByIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.country.is/')
    if (!res.ok) return null
    const data = (await res.json()) as { country?: string }
    const code = data.country?.toUpperCase() ?? null
    return code
  } catch {
    return null
  }
}

// Resolve a best-guess country. IP geolocation FIRST (reflects where you
// physically are), then OS locale as a fallback — the locale region can be wrong
// (e.g. an en-GB system used in Japan reports GB).
export async function resolveCountry(): Promise<string | null> {
  return (await fetchCountryByIp()) ?? detectCountryCode()
}
