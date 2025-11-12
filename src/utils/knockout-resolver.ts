import { supabaseAdmin } from '@/lib/supabase'

export type PlaceholderType =
  | `winner_group_${string}`
  | `runner_up_group_${string}`
  | string // Direct UUID

export interface MatchPairing {
  cupGameweekId: string
  homeManager: PlaceholderType
  awayManager: PlaceholderType
}

export interface ResolvedPairing {
  cupGameweekId: string
  homeManagerId: string
  awayManagerId: string
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
 */
export async function resolvePlaceholder(
  placeholder: PlaceholderType,
  cupId: string
): Promise<{ managerId: string | null; error?: string }> {
  // If it's already a UUID, return it
  if (placeholder.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return { managerId: placeholder }
  }

  // Parse placeholder format: "winner_group_A" or "runner_up_group_B"
  const winnerMatch = placeholder.match(/^winner_group_([A-Z])$/i)
  const runnerUpMatch = placeholder.match(/^runner_up_group_([A-Z])$/i)

  if (!winnerMatch && !runnerUpMatch) {
    return {
      managerId: null,
      error: `Invalid placeholder format: ${placeholder}. Expected "winner_group_X" or "runner_up_group_X" or UUID`
    }
  }

  const groupName = (winnerMatch?.[1] || runnerUpMatch?.[1] || '').toUpperCase()
  const position = winnerMatch ? 1 : 2

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
