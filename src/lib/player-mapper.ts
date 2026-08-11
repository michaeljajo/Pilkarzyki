import type { Player, Position } from '@/types'

/**
 * A row as it actually comes back from the `players` table: snake_case, with
 * nullable columns. The domain `Player` type is camelCase, so casting a row
 * straight to `Player` (as several call sites used to) type-checks only under
 * `as unknown as` and then silently reads `undefined` from `managerId`.
 *
 * Select with SQUAD_PLAYER_COLUMNS and convert with mapPlayerRow so the
 * boundary between DB shape and domain shape stays explicit.
 */
export interface PlayerRow {
  id: string
  name: string
  surname: string
  league: string
  position: Position
  club?: string | null
  football_league?: string | null
  league_id: string
  manager_id?: string | null
  total_goals?: number | null
  created_at?: string | null
  updated_at?: string | null
}

/** Column list matching PlayerRow. Keep the two in sync. */
export const SQUAD_PLAYER_COLUMNS =
  'id, name, surname, league, league_id, position, club, football_league, manager_id, total_goals, created_at, updated_at'

export function mapPlayerRow(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    surname: row.surname,
    leagueId: row.league_id,
    league: row.league,
    position: row.position,
    club: row.club ?? undefined,
    footballLeague: row.football_league ?? undefined,
    managerId: row.manager_id ?? undefined,
    totalGoals: row.total_goals ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(0),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(0),
  }
}

/**
 * Groups squad players by their owning manager. Rows without a manager_id are
 * skipped — they belong to the unassigned draft pool, not to a squad.
 */
export function groupPlayersByManager(
  rows: PlayerRow[] | null | undefined
): Map<string, Player[]> {
  const byManager = new Map<string, Player[]>()

  for (const row of rows ?? []) {
    if (!row.manager_id) continue
    const list = byManager.get(row.manager_id) ?? []
    list.push(mapPlayerRow(row))
    byManager.set(row.manager_id, list)
  }

  return byManager
}
