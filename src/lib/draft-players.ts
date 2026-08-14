import { Position } from '@/types'

// Goalkeepers ("Bramkarz") are intentionally NOT supported in the draft pool.
// Only outfield positions are allowed for the 2026/27 season.
const POSITION_MAP: Record<string, Position> = {
  obronca: 'Defender',
  pomocnik: 'Midfielder',
  napastnik: 'Forward',
  defender: 'Defender',
  midfielder: 'Midfielder',
  forward: 'Forward',
}

export const ALLOWED_POSITIONS_PL = 'Obrońca, Pomocnik, Napastnik'

// Lowercase + strip diacritics so "Obrońca" / "obronca" both resolve.
function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Maps a Polish (or English) position name to the English enum, or null. */
export function resolvePosition(raw: string): Position | null {
  return POSITION_MAP[normalizeKey(raw)] ?? null
}

/** English position enum -> Polish label, for display. */
export const POSITION_LABEL_PL: Record<string, string> = {
  Goalkeeper: 'Bramkarz',
  Defender: 'Obrońca',
  Midfielder: 'Pomocnik',
  Forward: 'Napastnik',
}

/** Polish label for a position, falling back to the raw value. */
export function positionLabel(pos: string): string {
  return POSITION_LABEL_PL[pos] || pos
}

/**
 * Lowercase + strip diacritics, so searching "zielinski" matches "Zieliński".
 * Shared by the draft board and the admin player list so both filter alike.
 */
export function foldText(value: string): string {
  return normalizeKey(value)
}

/** Splits a full name into { name, surname } — first token is the first name. */
export function splitFullName(full: string): { name: string; surname: string } {
  const parts = full.trim().split(/\s+/)
  const name = parts[0] || ''
  const surname = parts.length > 1 ? parts.slice(1).join(' ') : ''
  return { name, surname }
}

// ---------------------------------------------------------------------------
// Player list filters (draft board + admin player list)
// ---------------------------------------------------------------------------

/** Minimum shape a row needs to be filtered by league / club / position. */
export interface FilterablePlayer {
  club?: string | null
  football_league?: string | null
  position: string
}

export interface PlayerFilters {
  league: string
  club: string
  position: string
}

export type PlayerFilterKey = keyof PlayerFilters

export const EMPTY_PLAYER_FILTERS: PlayerFilters = { league: '', club: '', position: '' }

export function hasActiveFilters(filters: PlayerFilters): boolean {
  return Boolean(filters.league || filters.club || filters.position)
}

const FIELD_OF: Record<PlayerFilterKey, (p: FilterablePlayer) => string | null> = {
  league: (p) => p.football_league ?? null,
  club: (p) => p.club ?? null,
  position: (p) => p.position ?? null,
}

const FILTER_KEYS: PlayerFilterKey[] = ['league', 'club', 'position']

/** True when a player satisfies every set filter (empty string = "all"). */
export function matchesPlayerFilters(p: FilterablePlayer, filters: PlayerFilters): boolean {
  return FILTER_KEYS.every((key) => !filters[key] || FIELD_OF[key](p) === filters[key])
}

function distinctSorted(pool: FilterablePlayer[], read: (p: FilterablePlayer) => string | null): string[] {
  const set = new Set<string>()
  pool.forEach((p) => {
    const v = read(p)
    if (v) set.add(v)
  })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
}

/**
 * Options for one filter, narrowed by the *other* active filters — picking the
 * league "Anglia" leaves only English clubs in the club dropdown. The dimension's
 * own selection is ignored so its current value never disappears from its list.
 */
export function playerFilterOptions(
  pool: FilterablePlayer[],
  filters: PlayerFilters,
  key: PlayerFilterKey
): string[] {
  const others: PlayerFilters = { ...filters, [key]: '' }
  return distinctSorted(
    pool.filter((p) => matchesPlayerFilters(p, others)),
    FIELD_OF[key]
  )
}

/**
 * Applies a filter change, dropping any *other* selection it strands (choosing
 * league "Hiszpania" while club "Arsenal" is set). Without this the list would
 * silently go empty for a reason the user cannot see. The filter just touched
 * always wins.
 */
export function reconcilePlayerFilters(
  pool: FilterablePlayer[],
  next: PlayerFilters,
  changed: PlayerFilterKey
): PlayerFilters {
  const result = { ...next }
  for (const key of FILTER_KEYS) {
    if (key === changed || !result[key]) continue
    if (!pool.some((p) => matchesPlayerFilters(p, result))) result[key] = ''
  }
  return result
}
