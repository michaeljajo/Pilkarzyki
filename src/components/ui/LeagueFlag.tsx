import { CSSProperties } from 'react'

// Emoji flag per league. The "Liga" column identifies the country of the club,
// and has been written three different ways over time: the Polish country noun
// ("Anglia" — what the squad scraper and the current import emit), the Polish
// adjective ("angielska" — older hand-made sheets), and occasionally the plain
// English name. All three map to the same flag so no player loses his flag
// because of how his row was imported. England uses the subdivision (tag) emoji.
const ENGLAND_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'

const LEAGUE_FLAGS: Record<string, string> = {
  // Polish nouns (current import format)
  francja: '🇫🇷',
  anglia: ENGLAND_FLAG,
  hiszpania: '🇪🇸',
  portugalia: '🇵🇹',
  wlochy: '🇮🇹',
  belgia: '🇧🇪',
  holandia: '🇳🇱',
  polska: '🇵🇱',
  turcja: '🇹🇷',
  niemcy: '🇩🇪',
  // Polish adjectives (legacy sheets)
  francuska: '🇫🇷',
  angielska: ENGLAND_FLAG,
  hiszpanska: '🇪🇸',
  portugalska: '🇵🇹',
  wloska: '🇮🇹',
  belgijska: '🇧🇪',
  holenderska: '🇳🇱',
  turecka: '🇹🇷',
  niemiecka: '🇩🇪',
  // English names (scraper output with POLISH_OUTPUT = False)
  france: '🇫🇷',
  england: ENGLAND_FLAG,
  spain: '🇪🇸',
  portugal: '🇵🇹',
  italy: '🇮🇹',
  belgium: '🇧🇪',
  netherlands: '🇳🇱',
  poland: '🇵🇱',
  turkey: '🇹🇷',
  germany: '🇩🇪',
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
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
