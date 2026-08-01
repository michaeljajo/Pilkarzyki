import { supabaseAdmin } from '@/lib/supabase'
import { Player } from '@/types'
import { evaluateDefaultLineup } from '@/lib/default-lineup-validation'
import {
  SQUAD_PLAYER_COLUMNS,
  groupPlayersByManager,
  type PlayerRow,
} from '@/lib/player-mapper'

export interface ApplyError {
  managerId?: string
  gameweekId?: string
  cupGameweekId?: string
  error: string
}

export interface ApplyResult {
  appliedLineups: number
  appliedCupLineups: number
  errors: ApplyError[]
}

export interface ApplyGameweek {
  id: string
  league_id: string
  week: number
}

/**
 * Materialise default lineups ("żelazko") for every manager who has no lineup
 * for the given (already locked) gameweek — league lineups and, where a cup
 * round maps to this gameweek, cup lineups too.
 *
 * Each default is validated against the manager's CURRENT squad before it is
 * written; invalid defaults (e.g. a defaulted player was transferred out) are
 * skipped, never materialised.
 *
 * This is the single source of truth shared by the nightly cron
 * (`/api/cron/apply-default-lineups`) and the admin Panel's manual
 * "Zastosuj żelazka teraz" fallback.
 */
export async function applyDefaultLineupsForGameweek(
  gameweek: ApplyGameweek
): Promise<ApplyResult> {
  const errors: ApplyError[] = []
  let appliedLineups = 0
  let appliedCupLineups = 0

  // Get all managers in this league (via squads)
  const { data: squads } = await supabaseAdmin
    .from('squads')
    .select('manager_id')
    .eq('league_id', gameweek.league_id)

  if (!squads || squads.length === 0) {
    return { appliedLineups, appliedCupLineups, errors }
  }

  const managerIds = squads.map((s) => s.manager_id)

  // Load current squads (players table is keyed by league NAME) so we can
  // validate each default against the manager's live squad before applying.
  const { data: leagueRow } = await supabaseAdmin
    .from('leagues')
    .select('name')
    .eq('id', gameweek.league_id)
    .single()

  let squadPlayersByManager = new Map<string, Player[]>()
  if (leagueRow) {
    const { data: leaguePlayers } = await supabaseAdmin
      .from('players')
      .select(SQUAD_PLAYER_COLUMNS)
      .eq('league', leagueRow.name)
      .in('manager_id', managerIds as string[])
      .not('manager_id', 'is', null)

    squadPlayersByManager = groupPlayersByManager(
      leaguePlayers as unknown as PlayerRow[] | null
    )
  }

  // Get existing lineups for this gameweek
  const { data: existingLineups } = await supabaseAdmin
    .from('lineups')
    .select('manager_id')
    .eq('gameweek_id', gameweek.id)

  const managersWithLineups = new Set(existingLineups?.map((l) => l.manager_id) || [])
  const managersWithoutLineups = managerIds.filter((id) => !managersWithLineups.has(id))

  // Cup rounds mapped to this gameweek (fetched once, reused for cup lineups).
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_id')
    .eq('league_gameweek_id', gameweek.id)

  // Managers who have a cup match this gameweek field a DUAL lineup, so their
  // league match auto-fills from the cup-week league default rather than the
  // regular one.
  const cupManagerIdsThisWeek = new Set<string>()
  if (cupGameweeks && cupGameweeks.length > 0) {
    const { data: allCupMatches } = await supabaseAdmin
      .from('cup_matches')
      .select('home_manager_id, away_manager_id')
      .in('cup_gameweek_id', cupGameweeks.map((c) => c.id))
    for (const m of allCupMatches ?? []) {
      cupManagerIdsThisWeek.add(m.home_manager_id)
      cupManagerIdsThisWeek.add(m.away_manager_id)
    }
  }

  // Fetch every manager's default in one query rather than one per manager.
  // This runs from the nightly cron across all leagues, and vercel.json caps
  // API routes at 30s.
  const defaultLineupByManager = new Map<
    string,
    { player_ids?: string[]; cup_week_player_ids?: string[] }
  >()
  if (managersWithoutLineups.length > 0) {
    const { data: defaultLineupRows } = await supabaseAdmin
      .from('default_lineups')
      .select('manager_id, player_ids, cup_week_player_ids')
      .eq('league_id', gameweek.league_id)
      .in('manager_id', managersWithoutLineups)

    for (const row of defaultLineupRows ?? []) {
      defaultLineupByManager.set(row.manager_id, row)
    }
  }

  // Apply default league lineups for managers without lineups
  for (const managerId of managersWithoutLineups) {
    const defaultLineup = defaultLineupByManager.get(managerId)

    // Dual week for this manager → use the cup-week league default.
    const isDualForManager = cupManagerIdsThisWeek.has(managerId)
    const chosenPlayerIds: string[] | undefined = isDualForManager
      ? defaultLineup?.cup_week_player_ids
      : defaultLineup?.player_ids

    const leagueValidity = evaluateDefaultLineup(
      chosenPlayerIds,
      squadPlayersByManager.get(managerId) ?? [],
      { requireExactlyThree: true }
    )

    const hasDefault = !!chosenPlayerIds && chosenPlayerIds.length > 0

    if (hasDefault && !leagueValidity.isValid) {
      console.warn(
        `[żelazko] Skipping invalid default league lineup for manager ${managerId}, gameweek ${gameweek.id} (week ${gameweek.week}, dual=${isDualForManager}). Removed players: ${leagueValidity.removedPlayerIds.join(', ') || 'none'}`
      )
    } else if (hasDefault && leagueValidity.isValid) {
      const { error: insertError } = await supabaseAdmin.from('lineups').insert({
        manager_id: managerId,
        gameweek_id: gameweek.id,
        player_ids: chosenPlayerIds,
        is_locked: true,
        total_goals: 0,
        is_from_default: true,
      })

      if (insertError) {
        console.error(`[żelazko] Error inserting default lineup for manager ${managerId}:`, insertError)
        errors.push({ managerId, gameweekId: gameweek.id, error: insertError.message })
      } else {
        appliedLineups++
      }
    }
  }

  if (cupGameweeks && cupGameweeks.length > 0) {
    for (const cupGameweek of cupGameweeks) {
      const { data: cupMatches } = await supabaseAdmin
        .from('cup_matches')
        .select('home_manager_id, away_manager_id')
        .eq('cup_gameweek_id', cupGameweek.id)

      if (!cupMatches || cupMatches.length === 0) continue

      const cupManagerIds = new Set<string>()
      cupMatches.forEach((match) => {
        cupManagerIds.add(match.home_manager_id)
        cupManagerIds.add(match.away_manager_id)
      })

      const { data: existingCupLineups } = await supabaseAdmin
        .from('cup_lineups')
        .select('manager_id')
        .eq('cup_gameweek_id', cupGameweek.id)

      const managersWithCupLineups = new Set(existingCupLineups?.map((l) => l.manager_id) || [])
      const managersWithoutCupLineups = Array.from(cupManagerIds).filter(
        (id) => !managersWithCupLineups.has(id)
      )

      // One query for the whole cup gameweek instead of one per manager.
      const defaultCupLineupByManager = new Map<string, { player_ids?: string[] }>()
      if (managersWithoutCupLineups.length > 0) {
        const { data: defaultCupRows } = await supabaseAdmin
          .from('default_cup_lineups')
          .select('manager_id, player_ids')
          .eq('cup_id', cupGameweek.cup_id)
          .in('manager_id', managersWithoutCupLineups)

        for (const row of defaultCupRows ?? []) {
          defaultCupLineupByManager.set(row.manager_id, row)
        }
      }

      for (const managerId of managersWithoutCupLineups) {
        const defaultCupLineup = defaultCupLineupByManager.get(managerId)

        const cupValidity = evaluateDefaultLineup(
          defaultCupLineup?.player_ids,
          squadPlayersByManager.get(managerId) ?? [],
          { requireExactlyThree: false }
        )

        const hasCupDefault =
          !!defaultCupLineup &&
          !!defaultCupLineup.player_ids &&
          defaultCupLineup.player_ids.length > 0

        if (hasCupDefault && !cupValidity.isValid) {
          console.warn(
            `[żelazko] Skipping invalid default cup lineup for manager ${managerId}, cup gameweek ${cupGameweek.id}. Removed players: ${cupValidity.removedPlayerIds.join(', ') || 'none'}`
          )
        } else if (hasCupDefault && cupValidity.isValid) {
          const { error: insertError } = await supabaseAdmin.from('cup_lineups').insert({
            manager_id: managerId,
            cup_gameweek_id: cupGameweek.id,
            player_ids: defaultCupLineup!.player_ids,
            is_locked: true,
            total_goals: 0,
            is_from_default: true,
          })

          if (insertError) {
            console.error(`[żelazko] Error inserting default cup lineup for manager ${managerId}:`, insertError)
            errors.push({ managerId, cupGameweekId: cupGameweek.id, error: insertError.message })
          } else {
            appliedCupLineups++
          }
        }
      }
    }
  }

  return { appliedLineups, appliedCupLineups, errors }
}
