import { supabaseAdmin } from '@/lib/supabase'
import type { ResolvedMatchTeam, CupMatchWithManagers } from '@/types'

export type PlaceholderType =
  | `winner_group_${string}`  // Group stage: winner_group_A
  | `runner_up_group_${string}`  // Group stage: runner_up_group_B
  | `QF${number}`  // Quarter-final winner: QF1, QF2, QF3, QF4
  | `SF${number}`  // Semi-final winner: SF1, SF2
  | string // Direct UUID or short format (A1, B2)

export interface MatchPairing {
  cupGameweekId: string
  homeManager: PlaceholderType
  awayManager: PlaceholderType
}

export interface ResolvedPairing {
  cupGameweekId: string
  homeManagerId: string | null
  awayManagerId: string | null
}

export interface QualifiedTeam {
  managerId: string
  managerName: string
  groupName: string
  position: number
  points: number
  qualified: boolean
}

/**
 * Fetches qualified teams from cup group standings
 */
export async function getQualifiedTeams(cupId: string): Promise<{
  teams: QualifiedTeam[]
  error?: string
}> {
  try {
    const { data: standings, error } = await supabaseAdmin
      .from('cup_group_standings')
      .select(`
        manager_id,
        group_name,
        position,
        points,
        qualified,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('cup_id', cupId)
      .eq('qualified', true)
      .order('group_name', { ascending: true })
      .order('position', { ascending: true })

    if (error) {
      return { teams: [], error: error.message }
    }

    const teams: QualifiedTeam[] = (standings || []).map((s: any) => ({
      managerId: s.manager_id,
      managerName: s.users?.first_name
        ? `${s.users.first_name} ${s.users.last_name || ''}`.trim()
        : s.users?.email || 'Unknown',
      groupName: s.group_name,
      position: s.position,
      points: s.points,
      qualified: s.qualified
    }))

    return { teams }
  } catch (error) {
    return {
      teams: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Resolves placeholder strings to actual manager UUIDs
 * Supports multiple formats:
 * - Short group format: "A1", "B2" (group letter + position)
 * - Long group format: "winner_group_A", "runner_up_group_B"
 * - Knockout stage format: "QF1", "QF2", "SF1", "SF2" (match winner references)
 */
export async function resolvePlaceholder(
  placeholder: PlaceholderType,
  cupId: string
): Promise<{ managerId: string | null; error?: string }> {
  // If it's already a UUID, return it
  if (placeholder.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return { managerId: placeholder }
  }

  // Parse knockout stage format: "QF1", "QF2", "SF1", "SF2"
  const knockoutMatch = placeholder.match(/^(QF|SF)(\d+)$/i)
  if (knockoutMatch) {
    const stagePrefix = knockoutMatch[1].toUpperCase()
    const matchNumber = parseInt(knockoutMatch[2])

    // Map prefix to stage
    const stageMap: Record<string, string> = {
      'QF': 'quarter_final',
      'SF': 'semi_final'
    }

    const stage = stageMap[stagePrefix]
    if (!stage) {
      return {
        managerId: null,
        error: `Invalid knockout stage prefix: ${stagePrefix}. Expected QF or SF`
      }
    }

    try {
      // Look up the winner of the specified knockout match
      // We look at both legs to find the winner_id
      const { data: matches, error } = await supabaseAdmin
        .from('cup_matches')
        .select('winner_id, match_number')
        .eq('cup_id', cupId)
        .eq('stage', stage)
        .eq('match_number', matchNumber)
        .not('winner_id', 'is', null)
        .limit(1)

      if (error || !matches || matches.length === 0) {
        return {
          managerId: null,
          error: `No winner found for ${placeholder}. The match may not be completed yet.`
        }
      }

      return { managerId: matches[0].winner_id }
    } catch (error) {
      return {
        managerId: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Parse short group format: "A1" (winner of group A), "B2" (runner-up of group B)
  const shortMatch = placeholder.match(/^([A-Z])([12])$/i)

  // Parse long group format: "winner_group_A" or "runner_up_group_B"
  const winnerMatch = placeholder.match(/^winner_group_([A-Z])$/i)
  const runnerUpMatch = placeholder.match(/^runner_up_group_([A-Z])$/i)

  let groupName: string
  let position: number

  if (shortMatch) {
    // Short format: A1, B2, etc.
    groupName = shortMatch[1].toUpperCase()
    position = parseInt(shortMatch[2])
  } else if (winnerMatch || runnerUpMatch) {
    // Long format: winner_group_A, runner_up_group_B
    groupName = (winnerMatch?.[1] || runnerUpMatch?.[1] || '').toUpperCase()
    position = winnerMatch ? 1 : 2
  } else {
    return {
      managerId: null,
      error: `Invalid placeholder format: ${placeholder}. Expected "A1", "B2", "QF1", "SF1" or "winner_group_X", "runner_up_group_X" or UUID`
    }
  }

  try {
    const { data: standing, error } = await supabaseAdmin
      .from('cup_group_standings')
      .select('manager_id')
      .eq('cup_id', cupId)
      .eq('group_name', groupName)
      .eq('position', position)
      .eq('qualified', true)
      .single()

    if (error || !standing) {
      return {
        managerId: null,
        error: `No qualified team found for position ${position} in group ${groupName}`
      }
    }

    return { managerId: standing.manager_id }
  } catch (error) {
    return {
      managerId: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Resolves all match pairings from placeholders to UUIDs
 */
export async function resolveMatchPairings(
  pairings: MatchPairing[],
  cupId: string
): Promise<{
  resolved: ResolvedPairing[]
  errors: string[]
}> {
  const resolved: ResolvedPairing[] = []
  const errors: string[] = []

  for (const pairing of pairings) {
    const homeResult = await resolvePlaceholder(pairing.homeManager, cupId)
    const awayResult = await resolvePlaceholder(pairing.awayManager, cupId)

    if (homeResult.error) {
      errors.push(`Home team: ${homeResult.error}`)
      continue
    }

    if (awayResult.error) {
      errors.push(`Away team: ${awayResult.error}`)
      continue
    }

    if (!homeResult.managerId || !awayResult.managerId) {
      errors.push('Failed to resolve manager IDs')
      continue
    }

    resolved.push({
      cupGameweekId: pairing.cupGameweekId,
      homeManagerId: homeResult.managerId,
      awayManagerId: awayResult.managerId
    })
  }

  return { resolved, errors }
}

/**
 * Format placeholder for display
 * Re-exported from placeholder-formatter for backward compatibility
 */
export { formatPlaceholder } from './placeholder-formatter'

/**
 * Resolve a match team (either from manager_id or placeholder)
 * Returns resolved team info or placeholder display text
 */
export async function resolveMatchTeam(
  managerId: string | null | undefined,
  teamSource: string | null | undefined,
  cupId: string
): Promise<ResolvedMatchTeam> {
  // If manager ID exists, it's already resolved
  if (managerId) {
    const { data: manager } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', managerId)
      .single()

    if (manager) {
      const managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || manager.email
      return {
        type: 'resolved',
        managerId: manager.id,
        managerName,
        placeholderText: teamSource ? formatPlaceholder(teamSource).full : managerName,
        placeholderShort: teamSource ? formatPlaceholder(teamSource).short : managerName
      }
    }
  }

  // Try to resolve from placeholder
  if (teamSource) {
    const { managerId: resolvedId } = await resolvePlaceholder(teamSource, cupId)

    if (resolvedId) {
      // Placeholder can now be resolved
      const { data: manager } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', resolvedId)
        .single()

      if (manager) {
        const managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || manager.email
        return {
          type: 'resolved',
          managerId: manager.id,
          managerName,
          placeholderText: formatPlaceholder(teamSource).full,
          placeholderShort: formatPlaceholder(teamSource).short
        }
      }
    }

    // Placeholder can't be resolved yet - return placeholder text
    const formatted = formatPlaceholder(teamSource)
    return {
      type: 'placeholder',
      placeholderText: formatted.full,
      placeholderShort: formatted.short
    }
  }

  // Shouldn't happen due to DB constraint, but handle gracefully
  return {
    type: 'placeholder',
    placeholderText: 'TBD',
    placeholderShort: 'TBD'
  }
}

/**
 * Bulk resolve all matches in a list
 */
export async function resolveMatches(
  matches: CupMatchWithManagers[],
  cupId: string
): Promise<Array<CupMatchWithManagers & {
  resolvedHome: ResolvedMatchTeam
  resolvedAway: ResolvedMatchTeam
}>> {
  const resolved = await Promise.all(
    matches.map(async (match) => ({
      ...match,
      resolvedHome: await resolveMatchTeam(match.home_manager_id, match.home_team_source, cupId),
      resolvedAway: await resolveMatchTeam(match.away_manager_id, match.away_team_source, cupId)
    }))
  )

  return resolved
}

/**
 * Validates that the group stage is complete and standings are calculated
 */
export async function validateGroupStageComplete(cupId: string): Promise<{
  isComplete: boolean
  error?: string
}> {
  try {
    // Check if cup exists and is in correct stage
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('stage')
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return { isComplete: false, error: 'Cup not found' }
    }

    // Group stage must be completed before knockout draw
    if (cup.stage === 'group_stage') {
      // Check if all group stage matches are completed
      const { data: matches, error: matchError } = await supabaseAdmin
        .from('cup_matches')
        .select('id, is_completed')
        .eq('cup_id', cupId)
        .eq('stage', 'group_stage')

      if (matchError) {
        return { isComplete: false, error: matchError.message }
      }

      const allCompleted = matches?.every(m => m.is_completed) || false
      if (!allCompleted) {
        return {
          isComplete: false,
          error: 'Not all group stage matches are completed'
        }
      }
    }

    // Check if standings exist and qualified teams are marked
    const { data: standings, error: standingsError } = await supabaseAdmin
      .from('cup_group_standings')
      .select('qualified')
      .eq('cup_id', cupId)
      .eq('qualified', true)

    if (standingsError) {
      return { isComplete: false, error: standingsError.message }
    }

    if (!standings || standings.length === 0) {
      return {
        isComplete: false,
        error: 'No qualified teams found. Please calculate standings first.'
      }
    }

    return { isComplete: true }
  } catch (error) {
    return {
      isComplete: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
