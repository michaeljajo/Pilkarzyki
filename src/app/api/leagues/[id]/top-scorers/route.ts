import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TopScorer } from '@/types'
import { batchGetManagersAtGameweek } from '@/utils/transfer-resolver'

/**
 * GET /api/leagues/[id]/top-scorers
 * Fetch top scorers for league competition
 * Returns players with their total goals sorted by goals descending
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a member of this league (has a squad) and get league name
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const leagueName = league.name

    const { data: userSquad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', leagueId)
      .eq('manager_id', userRecord.id)
      .single()

    if (!userSquad) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this league.' },
        { status: 403 }
      )
    }

    // Fetch all league lineups for this league to determine which players participated in league matches
    // We need to:
    // 1. Get all gameweeks for this league
    // 2. Get all league lineups for those gameweeks
    // 3. Get results only for players who were in league lineups
    // 4. Aggregate goals by player
    // 5. Join with players to get player details
    // 6. Join with users to get manager names

    // Get all gameweeks for this league
    const { data: gameweeks, error: gameweeksError } = await supabaseAdmin
      .from('gameweeks')
      .select('id')
      .eq('league_id', leagueId)

    if (gameweeksError) {
      console.error('Error fetching gameweeks:', gameweeksError)
      return NextResponse.json(
        { error: 'Failed to fetch gameweeks' },
        { status: 500 }
      )
    }

    if (!gameweeks || gameweeks.length === 0) {
      // No gameweeks yet
      return NextResponse.json({ topScorers: [] })
    }

    const gameweekIds = gameweeks.map((gw) => gw.id)

    // Get all league lineups for these gameweeks
    const { data: leagueLineups, error: leagueLineupsError } = await supabaseAdmin
      .from('lineups')
      .select('player_ids, gameweek_id')
      .in('gameweek_id', gameweekIds)

    if (leagueLineupsError) {
      console.error('Error fetching league lineups:', leagueLineupsError)
      return NextResponse.json(
        { error: 'Failed to fetch league lineups' },
        { status: 500 }
      )
    }

    // Build a set of (gameweek_id + player_id) for players in league lineups
    const leaguePlayersSet = new Set<string>()
    leagueLineups?.forEach((lineup) => {
      lineup.player_ids?.forEach((playerId: string) => {
        leaguePlayersSet.add(`${lineup.gameweek_id}_${playerId}`)
      })
    })

    if (leaguePlayersSet.size === 0) {
      // No players in league lineups yet
      return NextResponse.json({ topScorers: [] })
    }

    // Fetch results for these gameweeks
    const { data: resultsData, error: resultsError } = await supabaseAdmin
      .from('results')
      .select('player_id, goals, gameweek_id')
      .in('gameweek_id', gameweekIds)
      .gt('goals', 0)


    if (resultsError) {
      console.error('Error fetching results:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    // Filter results to only include players who were in league lineups
    // and aggregate goals by (player, historical manager) combination
    // This ensures goals are attributed to the manager who owned the player at the time
    const playerManagerGoalsMap = new Map<
      string,
      {
        playerId: string
        managerId: string | null
        totalGoals: number
        gameweeks: Set<string>
      }
    >()

    // Group results by gameweek for batch manager resolution
    const gameweekResultsMap = new Map<string, typeof resultsData>()
    resultsData?.forEach((result) => {
      const key = `${result.gameweek_id}_${result.player_id}`
      if (leaguePlayersSet.has(key)) {
        if (!gameweekResultsMap.has(result.gameweek_id)) {
          gameweekResultsMap.set(result.gameweek_id, [])
        }
        gameweekResultsMap.get(result.gameweek_id)!.push(result)
      }
    })

    // Resolve historical managers for each gameweek
    for (const [gameweekId, gameweekResults] of gameweekResultsMap.entries()) {
      const playerIds = gameweekResults.map(r => r.player_id)
      const managerMap = await batchGetManagersAtGameweek(playerIds, gameweekId, leagueId)

      // Aggregate goals by (player, manager) combination
      for (const result of gameweekResults) {
        const managerId = managerMap.get(result.player_id) || null
        const compositeKey = `${result.player_id}:${managerId || 'unassigned'}`

        const existing = playerManagerGoalsMap.get(compositeKey)
        if (existing) {
          existing.totalGoals += result.goals
          existing.gameweeks.add(result.gameweek_id)
        } else {
          playerManagerGoalsMap.set(compositeKey, {
            playerId: result.player_id,
            managerId,
            totalGoals: result.goals,
            gameweeks: new Set([result.gameweek_id]),
          })
        }
      }
    }

    // Get all unique player IDs and manager IDs
    const playerIds = Array.from(
      new Set(
        Array.from(playerManagerGoalsMap.values()).map(v => v.playerId)
      )
    )
    const managerIds = Array.from(
      new Set(
        Array.from(playerManagerGoalsMap.values())
          .map(v => v.managerId)
          .filter(Boolean) as string[]
      )
    )

    if (playerIds.length === 0) {
      // No goals scored yet
      return NextResponse.json({ topScorers: [] })
    }

    // Fetch player details (without manager join - we already have historical manager)
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, position')
      .in('id', playerIds)
      .eq('league', leagueName)

    if (playersError) {
      console.error('Error fetching players:', playersError)
      return NextResponse.json(
        { error: 'Failed to fetch player details' },
        { status: 500 }
      )
    }

    // Fetch manager details
    const { data: managers } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', managerIds)

    // Fetch squad team names for this league
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', managerIds)

    const playerMap = new Map(players?.map(p => [p.id, p]) || [])
    const managerMap = new Map(managers?.map(m => [m.id, m]) || [])
    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // Build top scorers array from playerManagerGoalsMap
    // Note: A player who transferred will appear multiple times (once per manager)
    const topScorers: TopScorer[] = Array.from(playerManagerGoalsMap.values())
      .map((stats) => {
        const player = playerMap.get(stats.playerId)
        if (!player) return null

        const manager = stats.managerId ? managerMap.get(stats.managerId) : null
        const squad = stats.managerId ? squadMap.get(stats.managerId) : null

        // Priority: team_name → first_name+last_name → email
        let managerName = 'Brak managera'
        if (manager) {
          if (squad?.team_name) {
            managerName = squad.team_name
          } else if (manager.first_name || manager.last_name) {
            managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim()
          } else {
            managerName = manager.email
          }
        }

        return {
          playerId: player.id,
          playerName: player.name,
          playerSurname: player.surname,
          position: player.position,
          managerId: stats.managerId || '',
          managerName,
          totalGoals: stats.totalGoals,
          gamesPlayed: stats.gameweeks.size,
        }
      })
      .filter((scorer): scorer is TopScorer => scorer !== null)
      .sort((a, b) => b.totalGoals - a.totalGoals)

    return NextResponse.json({ topScorers })
  } catch (error) {
    console.error('Error in league top scorers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
