import { CSSProperties } from 'react'

// England has no country flag emoji — it uses the subdivision (tag) sequence.
const ENGLAND_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'

/**
 * players.football_league is not written consistently. Three conventions are
 * live in the database at once, because different import paths produced
 * different shapes:
 *
 *   country noun        "Niemcy", "Polska", "Anglia", "Portugalia"   (~80%)
 *   competition name    "Bundesliga", "Premier League", "Serie A"    (~17%)
 *   country adjective   "niemiecka", "angielska", "francuska"        (~3%)
 *
 * This map previously held adjectives only, so roughly four in five players
 * fell through to the raw-text fallback and their card read "Anglia" instead
 * of showing a flag.
 *
 * Rather than normalising the column (a data migration that would have to be
 * repeated after every import), each country lists every alias it is known by.
 * When a new competition or spelling appears, add it here.
 */
const FLAGS_BY_COUNTRY: ReadonlyArray<{ flag: string; aliases: readonly string[] }> = [
  { flag: '🇩🇪', aliases: ['niemcy', 'niemiecka', 'bundesliga'] },
  { flag: '🇵🇱', aliases: ['polska', 'ekstraklasa'] },
  { flag: ENGLAND_FLAG, aliases: ['anglia', 'angielska', 'premier league'] },
  { flag: '🇮🇹', aliases: ['wlochy', 'wloska', 'serie a'] },
  { flag: '🇳🇱', aliases: ['holandia', 'holenderska', 'eredivisie'] },
  { flag: '🇪🇸', aliases: ['hiszpania', 'hiszpanska', 'la liga'] },
  { flag: '🇫🇷', aliases: ['francja', 'francuska', 'ligue 1'] },
  { flag: '🇵🇹', aliases: ['portugalia', 'portugalska', 'liga portugal', 'primeira liga'] },
  { flag: '🇹🇷', aliases: ['turcja', 'turecka', 'super lig'] },
  { flag: '🇧🇪', aliases: ['belgia', 'belgijska', 'pro league', 'jupiler pro league'] },
]

const LEAGUE_FLAGS: Record<string, string> = Object.fromEntries(
  FLAGS_BY_COUNTRY.flatMap(({ flag, aliases }) => aliases.map((alias) => [alias, flag]))
)

/**
 * Lowercase, strip diacritics, collapse whitespace.
 *
 * The ł replacement is separate because ł is its own Unicode letter rather
 * than l + a combining mark, so NFD does not decompose it and the diacritic
 * strip leaves it untouched. Without this, "Włochy" would never match.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when the league maps to a known flag. */
export function hasLeagueFlag(league?: string | null): boolean {
  return !!league && !!LEAGUE_FLAGS[normalize(league)]
}

/** A small emoji flag for a league, or null if unknown. `height` sets the
 *  approximate glyph size in px. */
export function LeagueFlag({
  league,
  height = 12,
  title,
  className,
}: {
  league?: string | null
  height?: number
  title?: string
  className?: string
}) {
  if (!league) return null
  const flag = LEAGUE_FLAGS[normalize(league)]
  if (!flag) return null

  const style: CSSProperties = {
    fontSize: height + 3,
    lineHeight: 1,
    verticalAlign: 'middle',
    flexShrink: 0,
  }
  return (
    <span className={className} title={title ?? league} aria-label={league} style={style}>
      {flag}
    </span>
  )
}
