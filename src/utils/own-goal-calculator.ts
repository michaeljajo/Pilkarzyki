/**
 * Calculate match scores accounting for own goals
 *
 * Own goals (-1) should:
 * 1. NOT count towards the scoring team's total
 * 2. Add 1 goal to the opponent's score
 *
 * @param homePlayerIds - Array of player IDs in home lineup
 * @param awayPlayerIds - Array of player IDs in away lineup
 * @param resultsMap - Map of player_id -> goals
 * @returns Object with homeScore and awayScore
 */
export function calculateMatchScore(
  homePlayerIds: string[],
  awayPlayerIds: string[],
  resultsMap: Map<string, number>
): { homeScore: number; awayScore: number } {
  let homeScore = 0
  let awayScore = 0

  // Calculate home team's goals (including own goals FOR the away team)
  if (homePlayerIds && homePlayerIds.length > 0) {
    homePlayerIds.forEach((playerId: string) => {
      const goals = resultsMap.get(playerId) || 0

      if (goals === -1) {
        // Own goal - add to AWAY team's score
        awayScore += 1
      } else if (goals > 0) {
        // Regular goals - add to HOME team's score
        homeScore += goals
      }
    })
  }

  // Calculate away team's goals (including own goals FOR the home team)
  if (awayPlayerIds && awayPlayerIds.length > 0) {
    awayPlayerIds.forEach((playerId: string) => {
      const goals = resultsMap.get(playerId) || 0

      if (goals === -1) {
        // Own goal - add to HOME team's score
        homeScore += 1
      } else if (goals > 0) {
        // Regular goals - add to AWAY team's score
        awayScore += goals
      }
    })
  }

  return { homeScore, awayScore }
}

/**
 * Calculate total goals for a lineup, excluding own goals
 * Own goals (-1) should not count in the lineup's total_goals
 *
 * @param playerIds - Array of player IDs in the lineup
 * @param resultsMap - Map of player_id -> goals
 * @returns Total goals scored (excluding own goals)
 */
export function calculateLineupTotalGoals(
  playerIds: string[],
  resultsMap: Map<string, number>
): number {
  if (!playerIds || playerIds.length === 0) {
    return 0
  }

  return playerIds.reduce((sum: number, playerId: string) => {
    const goals = resultsMap.get(playerId) || 0
    // Only count positive goals, ignore own goals (-1) and no goals (0)
    return sum + (goals > 0 ? goals : 0)
  }, 0)
}
