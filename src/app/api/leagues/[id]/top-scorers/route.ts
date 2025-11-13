import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TopScorer } from '@/types'

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

    console.log('Top Scorers Debug - League ID:', leagueId)
    console.log('Top Scorers Debug - Results count:', resultsData?.length)
    console.log('Top Scorers Debug - First few results:', resultsData?.slice(0, 3))

    if (resultsError) {
      console.error('Error fetching results:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    // Filter results to only include players who were in league lineups
    // and aggregate goals by player
    const playerGoalsMap = new Map<
      string,
      { totalGoals: number; gameweeks: Set<string> }
    >()

    resultsData?.forEach((result) => {
      const key = `${result.gameweek_id}_${result.player_id}`

      // Only count if player was in a league lineup for this gameweek
      if (leaguePlayersSet.has(key)) {
        const playerId = result.player_id
        const existing = playerGoalsMap.get(playerId)

        if (existing) {
          existing.totalGoals += result.goals
          existing.gameweeks.add(result.gameweek_id)
        } else {
          playerGoalsMap.set(playerId, {
            totalGoals: result.goals,
            gameweeks: new Set([result.gameweek_id]),
          })
        }
      }
    })

    // Get all player IDs
    const playerIds = Array.from(playerGoalsMap.keys())

    if (playerIds.length === 0) {
      // No goals scored yet
      return NextResponse.json({ topScorers: [] })
    }

    // Fetch player details with manager information
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select(`
        id,
        name,
        surname,
        position,
        manager_id,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('id', playerIds)
      .eq('league', leagueName)

    if (playersError) {
      console.error('Error fetching players:', playersError)
      return NextResponse.json(
        { error: 'Failed to fetch player details' },
        { status: 500 }
      )
    }

    // Get unique manager IDs from players
    const managerIds = Array.from(
      new Set(
        players?.map(p => p.manager_id).filter(Boolean) as string[]
      )
    )

    // Fetch squad team names for this league
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', managerIds)

    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // Build top scorers array
    const topScorers: TopScorer[] = players
      ?.map((player) => {
        const playerStats = playerGoalsMap.get(player.id)
        if (!playerStats) return null

        const manager = Array.isArray(player.users)
          ? player.users[0]
          : player.users

        const squad = player.manager_id ? squadMap.get(player.manager_id) : null

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
          managerId: player.manager_id || '',
          managerName,
          totalGoals: playerStats.totalGoals,
          gamesPlayed: playerStats.gameweeks.size,
        }
      })
      .filter((scorer): scorer is TopScorer => scorer !== null)
      .sort((a, b) => b.totalGoals - a.totalGoals) || []

    return NextResponse.json({ topScorers })
  } catch (error) {
    console.error('Error in league top scorers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
