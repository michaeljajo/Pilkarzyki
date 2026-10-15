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
// Transfer-window club updates (admin import, mode "update")
// ---------------------------------------------------------------------------

/** The columns of an existing pool player the club update needs to decide. */
export interface PoolPlayerRef {
  id: string
  name: string
  surname: string
  club?: string | null
  football_league?: string | null
}

/** One player's new club, ready to write. `row` is the spreadsheet line it came from. */
export interface ClubUpdate {
  id: string
  row: number
  club: string
  /** Omitted when the file has no Liga column, so the stored league is left alone. */
  football_league?: string | null
}

export interface ClubUpdatePlan {
  updates: ClubUpdate[]
  unchanged: number
  skipped: number
  errors: string[]
}

/**
 * The three columns this pass reads. Deliberately looser than DraftPoolImport:
 * a spreadsheet parsed at runtime can hold anything (or omit a cell entirely),
 * and update mode does not require the Pozycja column at all.
 */
export interface ClubUpdateRow {
  'Imię i Nazwisko'?: unknown
  'Klub'?: unknown
  'Liga'?: unknown
}

/**
 * Decide which pool players a transfer-window spreadsheet moves, without
 * touching the database — the whole matching policy in one testable place.
 *
 * Matching is by name alone. Club cannot be part of the key the way it is for
 * inserts: the club is precisely what changed, so keying on it would match
 * nobody. That makes a shared name genuinely ambiguous (a ten-league pool has
 * two Arthurs), and those rows are reported and skipped rather than guessed
 * at — silently moving the wrong Arthur is worse than not moving him.
 *
 * Position is deliberately ignored. This pass writes club and football league
 * and nothing else; ownership, goals and squad membership are not its business.
 */
export function planClubUpdates(
  rows: readonly ClubUpdateRow[],
  pool: readonly PoolPlayerRef[],
  leagueName: string
): ClubUpdatePlan {
  const plan: ClubUpdatePlan = { updates: [], unchanged: 0, skipped: 0, errors: [] }

  // Fold names the same way the draft board and admin search fold them, so
  // "Modrić" in the pool matches the ASCII "Modric" a squad scrape emits.
  const key = (first: string, surname: string) => foldText(`${first} ${surname}`)

  const byName = new Map<string, PoolPlayerRef[]>()
  for (const p of pool) {
    const k = key(p.name ?? '', p.surname ?? '')
    const bucket = byName.get(k)
    if (bucket) bucket.push(p)
    else byName.set(k, [p])
  }

  // An absent Liga column must not blank out the league every player already
  // has. Checked across the whole file, not just row one: a sheet-to-JSON pass
  // drops the key entirely for an empty cell, so a blank first row would
  // otherwise look like a missing column.
  const hasLigaColumn = rows.some(row => 'Liga' in row)

  const claimedBy = new Map<string, number>() // player id -> row that claimed it

  rows.forEach((row, i) => {
    const rowNum = i + 2 // Excel row number (1-indexed + header row)

    const fullName = String(row['Imię i Nazwisko'] ?? '').trim()
    const club = String(row['Klub'] ?? '').trim()

    if (!fullName || !club) {
      plan.errors.push(`Wiersz ${rowNum}: Brak wymaganych pól (Imię i Nazwisko, Klub)`)
      plan.skipped++
      return
    }

    const { name: firstName, surname } = splitFullName(fullName)
    if (!firstName) {
      plan.errors.push(`Wiersz ${rowNum}: Nieprawidłowe imię i nazwisko`)
      plan.skipped++
      return
    }

    const matches = byName.get(key(firstName, surname)) ?? []

    if (matches.length === 0) {
      plan.errors.push(
        `Wiersz ${rowNum}: Nie znaleziono zawodnika "${fullName}" w lidze ${leagueName}. ` +
        'Nowych zawodników dodaj trybem "Dodaj nowych".'
      )
      plan.skipped++
      return
    }

    if (matches.length > 1) {
      const where = matches.map(m => m.club ?? 'brak klubu').join(', ')
      plan.errors.push(
        `Wiersz ${rowNum}: W lidze jest ${matches.length} zawodników o nazwisku ` +
        `"${fullName}" (${where}). Zmień klub ręcznie na liście zawodników.`
      )
      plan.skipped++
      return
    }

    const player = matches[0]

    const already = claimedBy.get(player.id)
    if (already !== undefined) {
      plan.errors.push(
        `Wiersz ${rowNum}: "${fullName}" występuje w pliku ponownie (wiersz ${already}). ` +
        'Pominięto — zostaw jeden wiersz na zawodnika.'
      )
      plan.skipped++
      return
    }

    const footballLeague = hasLigaColumn
      ? (row['Liga'] ? String(row['Liga']).trim() || null : null)
      : undefined

    const clubSame = (player.club ?? '') === club
    const leagueSame = footballLeague === undefined
      || (player.football_league ?? null) === footballLeague

    if (clubSame && leagueSame) {
      plan.unchanged++
      return
    }

    claimedBy.set(player.id, rowNum)
    plan.updates.push(
      footballLeague === undefined
        ? { id: player.id, row: rowNum, club }
        : { id: player.id, row: rowNum, club, football_league: footballLeague }
    )
  })

  return plan
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
