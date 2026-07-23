import { CSSProperties } from 'react'

// Minimalistic flag chips rendered with CSS (no emoji — consistent across all
// devices). The "Liga" field holds a Polish country adjective; each maps to a
// simple flag drawn with gradients.
const FLAG_BG: Record<string, string> = {
  // Vertical tricolours
  francuska: 'linear-gradient(90deg,#0055A4 0 33.34%,#fff 33.34% 66.67%,#EF4135 66.67% 100%)',
  wloska: 'linear-gradient(90deg,#009246 0 33.34%,#fff 33.34% 66.67%,#CE2B37 66.67% 100%)',
  belgijska: 'linear-gradient(90deg,#000 0 33.34%,#FDDA24 33.34% 66.67%,#EF3340 66.67% 100%)',
  // Horizontal tricolours / bicolours
  niemiecka: 'linear-gradient(180deg,#000 0 33.34%,#DD0000 33.34% 66.67%,#FFCE00 66.67% 100%)',
  holenderska: 'linear-gradient(180deg,#AE1C28 0 33.34%,#fff 33.34% 66.67%,#21468B 66.67% 100%)',
  polska: 'linear-gradient(180deg,#fff 0 50%,#DC143C 50% 100%)',
  hiszpanska: 'linear-gradient(180deg,#AA151B 0 25%,#F1BF00 25% 75%,#AA151B 75% 100%)',
  portugalska: 'linear-gradient(90deg,#006600 0 40%,#DA291C 40% 100%)',
  turecka: '#E30A17',
  // England: red St George's cross on white
  angielska:
    'linear-gradient(#CF142B,#CF142B) center/100% 32% no-repeat, linear-gradient(#CF142B,#CF142B) center/32% 100% no-repeat, #fff',
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

/** True when the league maps to a known flag. */
export function hasLeagueFlag(league?: string | null): boolean {
  return !!league && !!FLAG_BG[normalize(league)]
}

/** A small emoji-sized flag chip for a league, or null if unknown. */
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
  const bg = FLAG_BG[normalize(league)]
  if (!bg) return null

  const style: CSSProperties = {
    display: 'inline-block',
    width: Math.round(height * 1.45),
    height,
    background: bg,
    borderRadius: 2,
    border: '1px solid rgba(0,0,0,0.15)',
    verticalAlign: 'middle',
    flexShrink: 0,
  }
  return <span className={className} title={title ?? league} aria-label={league} style={style} />
}
