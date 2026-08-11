import { supabaseAdmin } from '@/lib/supabase'
import { Player } from '@/types'
import { evaluateDefaultLineup } from '@/lib/default-lineup-validation'

/**
 * Outcome of the mandatory default-lineup check for one manager in one league.
 */
export interface DefaultLineupGateResult {
  /** True when the manager must set/fix a default before using league pages. */
  active: boolean
  /**
   * Which default is missing/invalid:
   *   1 — the regular league default (a league-only gameweek)
   *   2 — the cup-week default (league lineup + cup lineup for a gameweek that
   *       also has a cup match)
   * null when the gate is inactive.
   */
  stage: 1 | 2 | null
  /**
   * Names of players that were in a stored default but are no longer in the
   * current squad (e.g. transferred out). Empty when the gate is inactive or the
   * default is simply missing/incomplete rather than stale.
   */
  removedPlayerNames: string[]
}

const INACTIVE: DefaultLineupGateResult = { active: false, stage: null, removedPlayerNames: [] }

function playerFullName(p: { name?: string; surname?: string }): string {
  return `${p.name ?? ''} ${p.surname ?? ''}`.trim()
}

async function resolveRemovedNames(removedIds: Set<string>): Promise<string[]> {
  if (removedIds.size === 0) return []
  const names = new Set<string>()
  const { data: removedRows } = await supabaseAdmin
    .from('players')
    .select('id, name, surname')
    .in('id', Array.from(removedIds))
  for (const row of removedRows ?? []) {
    const n = playerFullName(row)
    if (n) names.add(n)
  }
  return Array.from(names)
}

/**
 * Decide whether the mandatory-default gate is active for the given Clerk user in
 * the given league, and which stage. This is the single server-side choke point
 * used by the league layout; it queries the CURRENT squad so a transfer that
 * removes a defaulted player automatically re-arms the gate.
 *
 * Two defaults are required:
 *   Stage 1 — the regular league default (used in league-only gameweeks).
 *   Stage 2 — the cup-week default: a (possibly different) league lineup for
 *             gameweeks that also have a cup match, plus the cup lineup itself.
 *             Only required when a cup currently applies to the manager.
 *
 * Stage 1 is enforced first; the manager sees stage 2 only once stage 1 is valid.
 * Non-managers (no squad) and pre-season states (no upcoming gameweek) are never
 * gated, which also prevents trapping a user on a page that cannot edit defaults.
 */
export async function checkDefaultLineupGate(
  clerkUserId: string,
  leagueId: string
): Promise<DefaultLineupGateResult> {
  try {
    // Resolve the internal user id.
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (!userRecord) return INACTIVE
    const managerId = userRecord.id

    // League name (players are keyed by league NAME, not id) + active status.
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, name, is_active')
      .eq('id', leagueId)
      .single()

    if (!league) return INACTIVE

    // Archived seasons are read-only: default saves would be rejected, so gating
    // there would trap the manager. Never gate an inactive league.
    if (league.is_active === false) return INACTIVE

    // While a draft (pre-season or mid-season) is open, squads are in flux —
    // forcing a default lineup then is pointless and would block the draft
    // screen itself. Never gate a league with an unfinished draft. The partial
    // unique index guarantees at most one such draft per league.
    const { data: openDraft } = await supabaseAdmin
      .from('drafts')
      .select('id')
      .eq('league_id', leagueId)
      .neq('status', 'finished')
      .maybeSingle()

    if (openDraft) return INACTIVE

    // Current squad for this manager in this league.
    const { data: squadPlayers } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, league, position, football_league')
      .eq('manager_id', managerId)
      .eq('league_id', league.id)

    const squad = (squadPlayers ?? []) as unknown as Player[]

    // Not a manager here, or squad not complete enough to field a lineup → no gate.
    if (squad.length < 3) return INACTIVE

    // Only gate when there is an upcoming (incomplete) gameweek to field.
    const { data: currentGameweek } = await supabaseAdmin
      .from('gameweeks')
      .select('id')
      .eq('league_id', leagueId)
      .eq('is_completed', false)
      .order('week', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!currentGameweek) return INACTIVE

    // Load both league defaults in one row.
    const { data: leagueDefault } = await supabaseAdmin
      .from('default_lineups')
      .select('player_ids, cup_week_player_ids')
      .eq('manager_id', managerId)
      .eq('league_id', leagueId)
      .maybeSingle()

    // ---- Stage 1: regular league default ----
    const regularValidity = evaluateDefaultLineup(leagueDefault?.player_ids, squad, {
      requireExactlyThree: true,
    })
    if (!regularValidity.isValid) {
      const removedPlayerNames = await resolveRemovedNames(new Set(regularValidity.removedPlayerIds))
      return { active: true, stage: 1, removedPlayerNames }
    }

    // ---- Stage 2: cup-week default (league + cup), only when a cup applies ----
    const cupApplies = await doesCupApplyToManager(leagueId, managerId, currentGameweek.id)
    if (cupApplies.applies && cupApplies.cupId) {
      const removedIds = new Set<string>()
      let stage2Invalid = false

      const cupWeekLeagueValidity = evaluateDefaultLineup(
        leagueDefault?.cup_week_player_ids,
        squad,
        { requireExactlyThree: true }
      )
      if (!cupWeekLeagueValidity.isValid) {
        stage2Invalid = true
        cupWeekLeagueValidity.removedPlayerIds.forEach((id) => removedIds.add(id))
      }

      const { data: cupDefault } = await supabaseAdmin
        .from('default_cup_lineups')
        .select('player_ids')
        .eq('manager_id', managerId)
        .eq('cup_id', cupApplies.cupId)
        .maybeSingle()

      const cupValidity = evaluateDefaultLineup(cupDefault?.player_ids, squad, {
        requireExactlyThree: false,
      })
      if (!cupValidity.isValid) {
        stage2Invalid = true
        cupValidity.removedPlayerIds.forEach((id) => removedIds.add(id))
      }

      if (stage2Invalid) {
        const removedPlayerNames = await resolveRemovedNames(removedIds)
        return { active: true, stage: 2, removedPlayerNames }
      }
    }

    return INACTIVE
  } catch (error) {
    // Never let the gate hard-fail a page render; fail open (no gate).
    console.error('[default-lineup-gate] check failed:', error)
    return INACTIVE
  }
}

/**
 * Determine whether a cup default is currently required for this manager, mirroring
 * the squad editor: a cup applies when the league has an active cup and the manager
 * is not eliminated. Elimination is detected only when the current gameweek maps to
 * a cup gameweek in which the manager has no match.
 */
async function doesCupApplyToManager(
  leagueId: string,
  managerId: string,
  currentGameweekId: string
): Promise<{ applies: boolean; cupId?: string }> {
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', leagueId)
    .eq('is_active', true)
    .maybeSingle()

  if (!cup) return { applies: false }

  // Is the current league gameweek a cup gameweek?
  const { data: cupGameweek } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id')
    .eq('cup_id', cup.id)
    .eq('league_gameweek_id', currentGameweekId)
    .maybeSingle()

  if (cupGameweek) {
    // Manager only needs a cup default if they still have a match this cup week.
    const { data: match } = await supabaseAdmin
      .from('cup_matches')
      .select('id')
      .eq('cup_gameweek_id', cupGameweek.id)
      .or(`home_manager_id.eq.${managerId},away_manager_id.eq.${managerId}`)
      .limit(1)
      .maybeSingle()

    if (!match) return { applies: false } // eliminated
  }

  return { applies: true, cupId: cup.id }
}
