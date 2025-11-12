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
  teamName?: string | null
  email: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  manualTiebreaker?: number | null
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
 * Calculate league standings with custom tiebreaker rules:
 * 1. Points (higher is better)
 * 2. Goals Scored (higher is better)
 * 3. Goals Conceded (higher is better - unlucky teams rank higher)
 * 4. Head-to-Head Record (when tied on points)
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

  // Fetch team names for all managers in this league
  const managerIds = managers?.map(m => m.id) || []
  const { data: squads } = await supabaseAdmin
    .from('squads')
    .select('manager_id, team_name')
    .eq('league_id', leagueId)
    .in('manager_id', managerIds)

  const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

  // Fetch manual tiebreakers for this league
  const { data: manualTiebreakers } = await supabaseAdmin
    .from('manual_tiebreakers')
    .select('manager_id, tiebreaker_value')
    .eq('league_id', leagueId)
    .in('manager_id', managerIds)

  const tiebreakerMap = new Map(manualTiebreakers?.map(t => [t.manager_id, t.tiebreaker_value]) || [])

  // Initialize stats for all managers
  const managerStats: Record<string, ManagerStats> = {}
  managers?.forEach(manager => {
    const managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || 'Unknown'
    const squad = squadMap.get(manager.id)
    managerStats[manager.id] = {
      managerId: manager.id,
      managerName,
      teamName: squad?.team_name || null,
      email: manager.email,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      manualTiebreaker: tiebreakerMap.get(manager.id) || null
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

  // Sort with custom tiebreaker rules
  return sortStandingsWithTiebreakers(standings, matches || [])
}

/**
 * Sort standings with custom league tiebreaker rules
 * 1. Points (higher is better)
 * 2. Goals Scored (higher is better)
 * 3. Goals Conceded (higher is better - unlucky teams rank higher)
 * 4. Head-to-Head Record (when teams are tied on points)
 * 5. Manual Tiebreaker (admin-set, lower value = higher rank)
 * 6. Alphabetical (final fallback)
 */
function sortStandingsWithTiebreakers(standings: ManagerStats[], matches: MatchResult[]): ManagerStats[] {
  return standings.sort((a, b) => {
    // 1. Points (descending)
    if (a.points !== b.points) {
      return b.points - a.points
    }

    // 2. Goals Scored (descending)
    if (a.goalsFor !== b.goalsFor) {
      return b.goalsFor - a.goalsFor
    }

    // 3. Goals Conceded (descending - more conceded = higher rank)
    if (a.goalsAgainst !== b.goalsAgainst) {
      return b.goalsAgainst - a.goalsAgainst
    }

    // 4. Head-to-Head Record (when tied on points)
    if (a.points === b.points) {
      const headToHead = calculateHeadToHead(a.managerId, b.managerId, matches)

      // H2H Points
      if (headToHead.aVsB.points !== headToHead.bVsA.points) {
        return headToHead.bVsA.points - headToHead.aVsB.points
      }

      // H2H Goals Scored
      if (headToHead.aVsB.goalsFor !== headToHead.bVsA.goalsFor) {
        return headToHead.bVsA.goalsFor - headToHead.aVsB.goalsFor
      }

      // H2H Goals Conceded (more conceded = higher rank)
      if (headToHead.aVsB.goalsAgainst !== headToHead.bVsA.goalsAgainst) {
        return headToHead.bVsA.goalsAgainst - headToHead.aVsB.goalsAgainst
      }
    }

    // 5. Manual Tiebreaker (ascending - lower value = higher rank)
    // Only applies if at least one team has a manual tiebreaker set
    if (a.manualTiebreaker !== null || b.manualTiebreaker !== null) {
      // If both have tiebreakers, compare them
      if (a.manualTiebreaker !== null && b.manualTiebreaker !== null) {
        if (a.manualTiebreaker !== b.manualTiebreaker) {
          return a.manualTiebreaker - b.manualTiebreaker
        }
      }
      // If only 'a' has a tiebreaker, it ranks higher
      if (a.manualTiebreaker !== null && b.manualTiebreaker === null) {
        return -1
      }
      // If only 'b' has a tiebreaker, it ranks higher
      if (a.manualTiebreaker === null && b.manualTiebreaker !== null) {
        return 1
      }
    }

    // 6. Alphabetical by manager name (final tiebreaker)
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

/**
 * Calculate and update cup group standings for a specific cup
 */
export async function recalculateCupGroupStandings(cupId: string): Promise<void> {
  // Get all cup matches for this cup that are completed
  const { data: cupMatches } = await supabaseAdmin
    .from('cup_matches')
    .select(`
      id,
      home_manager_id,
      away_manager_id,
      home_score,
      away_score,
      is_completed,
      group_name,
      stage
    `)
    .eq('cup_id', cupId)
    .eq('stage', 'group_stage')
    .eq('is_completed', true)

  // If there are no completed group stage matches, nothing to calculate
  if (!cupMatches || cupMatches.length === 0) {
    console.log(`No completed group stage matches found for cup ${cupId}`)
    return
  }

  // Get all groups in this cup
  const { data: cupGroups } = await supabaseAdmin
    .from('cup_groups')
    .select('group_name, manager_id')
    .eq('cup_id', cupId)

  // Group managers by their group
  const groupsByName: Record<string, string[]> = {}

  if (cupGroups && cupGroups.length > 0) {
    // Use explicit cup_groups if they exist
    cupGroups.forEach(group => {
      if (!groupsByName[group.group_name]) {
        groupsByName[group.group_name] = []
      }
      groupsByName[group.group_name].push(group.manager_id)
    })
  } else {
    // Infer groups from cup matches if cup_groups table is empty
    console.log(`No cup_groups found, inferring from matches for cup ${cupId}`)
    cupMatches.forEach(match => {
      if (match.group_name) {
        if (!groupsByName[match.group_name]) {
          groupsByName[match.group_name] = []
        }
        // Add managers to their respective groups
        if (!groupsByName[match.group_name].includes(match.home_manager_id)) {
          groupsByName[match.group_name].push(match.home_manager_id)
        }
        if (!groupsByName[match.group_name].includes(match.away_manager_id)) {
          groupsByName[match.group_name].push(match.away_manager_id)
        }
      }
    })
  }

  // If no groups were found, there's nothing to calculate
  if (Object.keys(groupsByName).length === 0) {
    console.log(`No groups found for cup ${cupId}`)
    return
  }

  // Fetch manual tiebreakers for this cup
  const allManagerIds = Object.values(groupsByName).flat()
  const { data: cupManualTiebreakers } = await supabaseAdmin
    .from('cup_manual_tiebreakers')
    .select('manager_id, tiebreaker_value')
    .eq('cup_id', cupId)
    .in('manager_id', allManagerIds)

  const cupTiebreakerMap = new Map(cupManualTiebreakers?.map(t => [t.manager_id, t.tiebreaker_value]) || [])

  // Calculate standings for each group
  const allStandings: Array<{
    cup_id: string
    group_name: string
    manager_id: string
    played: number
    won: number
    drawn: number
    lost: number
    goals_for: number
    goals_against: number
    goal_difference: number
    points: number
    position: number
    qualified: boolean
  }> = []

  for (const [groupName, managerIds] of Object.entries(groupsByName)) {
    // Initialize stats for all managers in this group
    const groupStats: Record<string, ManagerStats> = {}
    managerIds.forEach(managerId => {
      groupStats[managerId] = {
        managerId,
        managerName: '',
        email: '',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        manualTiebreaker: cupTiebreakerMap.get(managerId) || null
      }
    })

    // Process matches for this group
    const groupMatches = cupMatches?.filter(m => m.group_name === groupName) || []
    groupMatches.forEach(match => {
      if (match.home_score !== null && match.away_score !== null) {
        const homeStats = groupStats[match.home_manager_id]
        const awayStats = groupStats[match.away_manager_id]

        if (homeStats && awayStats) {
          // Update games played
          homeStats.played++
          awayStats.played++

          // Update goals
          homeStats.goalsFor += match.home_score
          homeStats.goalsAgainst += match.away_score
          awayStats.goalsFor += match.away_score
          awayStats.goalsAgainst += match.home_score

          // Determine result
          if (match.home_score > match.away_score) {
            homeStats.won++
            homeStats.points += 3
            awayStats.lost++
          } else if (match.away_score > match.home_score) {
            awayStats.won++
            awayStats.points += 3
            homeStats.lost++
          } else {
            homeStats.drawn++
            awayStats.drawn++
            homeStats.points += 1
            awayStats.points += 1
          }
        }
      }
    })

    // Calculate goal difference and sort
    Object.values(groupStats).forEach(stats => {
      stats.goalDifference = stats.goalsFor - stats.goalsAgainst
    })

    const sorted = sortStandingsWithTiebreakers(Object.values(groupStats), groupMatches)

    // Convert to cup standings format
    sorted.forEach((stats, index) => {
      allStandings.push({
        cup_id: cupId,
        group_name: groupName,
        manager_id: stats.managerId,
        played: stats.played,
        won: stats.won,
        drawn: stats.drawn,
        lost: stats.lost,
        goals_for: stats.goalsFor,
        goals_against: stats.goalsAgainst,
        goal_difference: stats.goalDifference,
        points: stats.points,
        position: index + 1,
        qualified: index < 2 // Top 2 qualify
      })
    })
  }

  // Update database
  // First delete existing standings for this cup
  await supabaseAdmin
    .from('cup_group_standings')
    .delete()
    .eq('cup_id', cupId)

  // Insert new standings
  if (allStandings.length > 0) {
    const { error } = await supabaseAdmin
      .from('cup_group_standings')
      .insert(allStandings)

    if (error) {
      console.error('Error updating cup group standings:', error)
      throw error
    }
  }

  console.log(`Successfully updated cup group standings for cup ${cupId}`)
}