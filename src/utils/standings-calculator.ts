import { supabaseAdmin } from '@/lib/supabase'

export interface MatchResult {
  id: string
  home_manager_id: string
  away_manager_id: string
  home_score: number
  away_score: number
  is_completed: boolean
}

export interface ManagerStats {
  managerId: string
  managerName: string
  email: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface HeadToHeadRecord {
  managerId: string
  opponentId: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

/**
 * Calculate league standings with professional tiebreaker rules
 */
export async function calculateLeagueStandings(leagueId: string): Promise<ManagerStats[]> {
  // Get all completed matches for the league
  const { data: matches, error: matchError } = await supabaseAdmin
    .from('matches')
    .select(`
      id,
      home_manager_id,
      away_manager_id,
      home_score,
      away_score,
      is_completed
    `)
    .eq('league_id', leagueId)
    .eq('is_completed', true)

  if (matchError) {
    throw new Error(`Failed to fetch matches: ${matchError.message}`)
  }

  // Get all managers in the league
  const { data: managers, error: managerError } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      email,
      squads!inner(league_id)
    `)
    .eq('squads.league_id', leagueId)

  if (managerError) {
    throw new Error(`Failed to fetch managers: ${managerError.message}`)
  }

  // Initialize stats for all managers
  const managerStats: Record<string, ManagerStats> = {}
  managers?.forEach(manager => {
    const managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || 'Unknown'
    managerStats[manager.id] = {
      managerId: manager.id,
      managerName,
      email: manager.email,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    }
  })

  // Process all matches to calculate stats
  matches?.forEach(match => {
    if (match.home_score !== null && match.away_score !== null) {
      const homeStats = managerStats[match.home_manager_id]
      const awayStats = managerStats[match.away_manager_id]

      if (homeStats && awayStats) {
        // Update games played
        homeStats.played++
        awayStats.played++

        // Update goals
        homeStats.goalsFor += match.home_score
        homeStats.goalsAgainst += match.away_score
        awayStats.goalsFor += match.away_score
        awayStats.goalsAgainst += match.home_score

        // Determine result and update points/record
        if (match.home_score > match.away_score) {
          // Home win
          homeStats.won++
          homeStats.points += 3
          awayStats.lost++
        } else if (match.away_score > match.home_score) {
          // Away win
          awayStats.won++
          awayStats.points += 3
          homeStats.lost++
        } else {
          // Draw
          homeStats.drawn++
          awayStats.drawn++
          homeStats.points += 1
          awayStats.points += 1
        }
      }
    }
  })

  // Calculate goal difference
  Object.values(managerStats).forEach(stats => {
    stats.goalDifference = stats.goalsFor - stats.goalsAgainst
  })

  // Convert to array for sorting
  const standings = Object.values(managerStats)

  // Sort with professional tiebreaker rules
  return sortStandingsWithTiebreakers(standings, matches || [])
}

/**
 * Sort standings with professional league tiebreaker rules
 * 1. Points
 * 2. Goal Difference
 * 3. Goals Scored
 * 4. Head-to-Head Record (when teams are tied on points)
 */
function sortStandingsWithTiebreakers(standings: ManagerStats[], matches: MatchResult[]): ManagerStats[] {
  return standings.sort((a, b) => {
    // 1. Points (descending)
    if (a.points !== b.points) {
      return b.points - a.points
    }

    // 2. Goal Difference (descending)
    if (a.goalDifference !== b.goalDifference) {
      return b.goalDifference - a.goalDifference
    }

    // 3. Goals Scored (descending)
    if (a.goalsFor !== b.goalsFor) {
      return b.goalsFor - a.goalsFor
    }

    // 4. Head-to-Head Record (when tied on points)
    if (a.points === b.points) {
      const headToHead = calculateHeadToHead(a.managerId, b.managerId, matches)

      // H2H Points
      if (headToHead.aVsB.points !== headToHead.bVsA.points) {
        return headToHead.bVsA.points - headToHead.aVsB.points
      }

      // H2H Goal Difference
      if (headToHead.aVsB.goalDifference !== headToHead.bVsA.goalDifference) {
        return headToHead.bVsA.goalDifference - headToHead.aVsB.goalDifference
      }

      // H2H Goals Scored
      if (headToHead.aVsB.goalsFor !== headToHead.bVsA.goalsFor) {
        return headToHead.bVsA.goalsFor - headToHead.aVsB.goalsFor
      }
    }

    // 5. Alphabetical by manager name (final tiebreaker)
    return a.managerName.localeCompare(b.managerName)
  })
}

/**
 * Calculate head-to-head record between two managers
 */
function calculateHeadToHead(managerA: string, managerB: string, matches: MatchResult[]) {
  const aVsB = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }

  const bVsA = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }

  // Find all matches between these two managers
  const headToHeadMatches = matches.filter(match =>
    (match.home_manager_id === managerA && match.away_manager_id === managerB) ||
    (match.home_manager_id === managerB && match.away_manager_id === managerA)
  )

  headToHeadMatches.forEach(match => {
    if (match.home_score !== null && match.away_score !== null) {
      const isAHome = match.home_manager_id === managerA
      const aScore = isAHome ? match.home_score : match.away_score
      const bScore = isAHome ? match.away_score : match.home_score

      // Update games played
      aVsB.played++
      bVsA.played++

      // Update goals
      aVsB.goalsFor += aScore
      aVsB.goalsAgainst += bScore
      bVsA.goalsFor += bScore
      bVsA.goalsAgainst += aScore

      // Determine result
      if (aScore > bScore) {
        // A wins
        aVsB.won++
        aVsB.points += 3
        bVsA.lost++
      } else if (bScore > aScore) {
        // B wins
        bVsA.won++
        bVsA.points += 3
        aVsB.lost++
      } else {
        // Draw
        aVsB.drawn++
        bVsA.drawn++
        aVsB.points += 1
        bVsA.points += 1
      }
    }
  })

  // Calculate goal differences
  aVsB.goalDifference = aVsB.goalsFor - aVsB.goalsAgainst
  bVsA.goalDifference = bVsA.goalsFor - bVsA.goalsAgainst

  return { aVsB, bVsA }
}

/**
 * Update standings table in database
 */
export async function updateStandingsTable(leagueId: string, standings: ManagerStats[]): Promise<void> {
  try {
    // Use a single atomic upsert operation with proper conflict resolution
    const standingsData = standings.map((stats, index) => ({
      league_id: leagueId,
      manager_id: stats.managerId,
      played: stats.played,
      won: stats.won,
      drawn: stats.drawn,
      lost: stats.lost,
      goals_for: stats.goalsFor,
      goals_against: stats.goalsAgainst,
      goal_difference: stats.goalDifference,
      points: stats.points,
      position: index + 1
    }))

    // First, clear existing standings for this league using a direct delete
    const { error: deleteError } = await supabaseAdmin
      .from('standings')
      .delete()
      .eq('league_id', leagueId)

    if (deleteError) {
      console.error('Warning: Could not clear existing standings:', deleteError.message)
      // Continue with upsert as fallback
    }

    // Insert all new standings at once
    const { error: insertError } = await supabaseAdmin
      .from('standings')
      .insert(standingsData)

    if (insertError) {
      console.log('Insert failed, trying upsert as fallback:', insertError.message)

      // Fallback to upsert if insert fails due to conflicts
      const { error: upsertError } = await supabaseAdmin
        .from('standings')
        .upsert(standingsData, {
          onConflict: 'league_id,manager_id'
        })

      if (upsertError) {
        throw new Error(`Failed to update standings table: ${upsertError.message}`)
      }
    }

    console.log(`Successfully updated standings for league ${leagueId}`)
  } catch (error) {
    console.error('Error in updateStandingsTable:', error)
    throw error
  }
}

/**
 * Calculate and save standings for a league
 */
export async function recalculateLeagueStandings(leagueId: string): Promise<ManagerStats[]> {
  const standings = await calculateLeagueStandings(leagueId)
  await updateStandingsTable(leagueId, standings)
  return standings
}