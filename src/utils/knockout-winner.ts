import { supabaseAdmin } from '@/lib/supabase'
import { resolvePlaceholder } from '@/utils/knockout-resolver'

/**
 * Resolves next-round placeholders for a cup after winners have been determined.
 * Finds all knockout matches with null manager IDs and attempts to resolve them
 * from their team_source placeholders (e.g., QF1 → winner of QF match 1).
 */
export async function resolveNextRoundPlaceholders(cupId: string): Promise<number> {
  const { data: unresolvedMatches } = await supabaseAdmin
    .from('cup_matches')
    .select('id, home_manager_id, away_manager_id, home_team_source, away_team_source, stage')
    .eq('cup_id', cupId)
    .neq('stage', 'group_stage')
    .or('home_manager_id.is.null,away_manager_id.is.null')

  if (!unresolvedMatches || unresolvedMatches.length === 0) {
    return 0
  }

  let resolvedCount = 0

  for (const match of unresolvedMatches) {
    let homeManagerId = match.home_manager_id
    let awayManagerId = match.away_manager_id
    let updated = false

    if (!homeManagerId && match.home_team_source) {
      const result = await resolvePlaceholder(match.home_team_source, cupId)
      if (result.managerId) {
        homeManagerId = result.managerId
        updated = true
      }
    }

    if (!awayManagerId && match.away_team_source) {
      const result = await resolvePlaceholder(match.away_team_source, cupId)
      if (result.managerId) {
        awayManagerId = result.managerId
        updated = true
      }
    }

    if (updated) {
      const { error } = await supabaseAdmin
        .from('cup_matches')
        .update({
          home_manager_id: homeManagerId,
          away_manager_id: awayManagerId
        })
        .eq('id', match.id)

      if (!error) resolvedCount++
    }
  }

  return resolvedCount
}
