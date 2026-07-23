import { CSSProperties } from 'react'

// Emoji flag per league. The "Liga" field holds a Polish country adjective;
// each maps to the corresponding flag emoji. England uses the subdivision
// (tag) flag emoji.
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
