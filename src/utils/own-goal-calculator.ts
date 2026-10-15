/**
 * A player's tally for one gameweek, as stored in the `results` table.
 *
 * Goals and own goals are independent counts, so a player who scores and also
 * puts one into his own net is recorded as { goals: 1, ownGoals: 1 } — both
 * teams get a goal, rather than the two cancelling out.
 */
export interface PlayerGoalTally {
  goals: number
  ownGoals: number
}

export type ResultsMap = Map<string, PlayerGoalTally>

/** The `results` columns the scoring functions need. */
export interface ResultGoalsRow {
  player_id: string
  goals: number | null
  own_goals: number | null
}

/** Build a player_id → tally map from `results` rows. */
export function buildResultsMap(rows: ResultGoalsRow[] | null | undefined): ResultsMap {
  return new Map(
    (rows ?? []).map((r) => [r.player_id, { goals: r.goals ?? 0, ownGoals: r.own_goals ?? 0 }])
  )
}

/**
 * Calculate match scores accounting for own goals.
 *
 * A player's goals count for his own team; each of his own goals adds 1 to the
 * opponent's score.
 *
 * @param homePlayerIds - Array of player IDs in home lineup
 * @param awayPlayerIds - Array of player IDs in away lineup
 * @param resultsMap - Map of player_id -> goal tally
 * @returns Object with homeScore and awayScore
 */
export function calculateMatchScore(
  homePlayerIds: string[],
  awayPlayerIds: string[],
  resultsMap: ResultsMap
): { homeScore: number; awayScore: number } {
  let homeScore = 0
  let awayScore = 0

  for (const playerId of homePlayerIds ?? []) {
    const tally = resultsMap.get(playerId)
    if (!tally) continue
    homeScore += tally.goals
    awayScore += tally.ownGoals
  }

  for (const playerId of awayPlayerIds ?? []) {
    const tally = resultsMap.get(playerId)
    if (!tally) continue
    awayScore += tally.goals
    homeScore += tally.ownGoals
  }

  return { homeScore, awayScore }
}

/**
 * Calculate total goals for a lineup, excluding own goals.
 * Own goals never count in the lineup's own total_goals.
 *
 * @param playerIds - Array of player IDs in the lineup
 * @param resultsMap - Map of player_id -> goal tally
 * @returns Total goals scored (excluding own goals)
 */
export function calculateLineupTotalGoals(
  playerIds: string[],
  resultsMap: ResultsMap
): number {
  if (!playerIds || playerIds.length === 0) {
    return 0
  }

  return playerIds.reduce(
    (sum: number, playerId: string) => sum + (resultsMap.get(playerId)?.goals ?? 0),
    0
  )
}

/** Label shown next to a player's name: "(OG)", or "(2× OG)" for several. */
export function formatOwnGoalLabel(ownGoals: number): string {
  return ownGoals > 1 ? `(${ownGoals}× OG)` : '(OG)'
}
