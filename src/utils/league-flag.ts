// Flag emoji per league. The "Liga" field holds a Polish country adjective
// (angielska, hiszpańska, …); map it to the corresponding flag. England uses
// the subdivision (tag) flag emoji.

const ENGLAND_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'

const LEAGUE_FLAGS: Record<string, string> = {
  francuska: '🇫🇷',
  angielska: ENGLAND_FLAG,
  hiszpanska: '🇪🇸',
  portugalska: '🇵🇹',
  wloska: '🇮🇹',
  belgijska: '🇧🇪',
  holenderska: '🇳🇱',
  polska: '🇵🇱',
  turecka: '🇹🇷',
  niemiecka: '🇩🇪',
}

// Lowercase + strip diacritics so "hiszpańska" / "hiszpanska" both resolve.
function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

/** Returns the flag emoji for a league value, or '' if unknown. */
export function leagueFlag(league?: string | null): string {
  if (!league) return ''
  return LEAGUE_FLAGS[normalize(league)] || ''
}
