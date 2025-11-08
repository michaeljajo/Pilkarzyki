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

    // Fetch all results for this league with player and manager details
    // We need to:
    // 1. Get all gameweeks for this league
    // 2. Get all results for those gameweeks
    // 3. Aggregate goals by player
    // 4. Join with players to get player details
    // 5. Join with users to get manager names

    const { data: resultsData, error: resultsError } = await supabaseAdmin
      .from('results')
      .select(`
        player_id,
        goals,
        gameweek_id,
        gameweeks!inner (
          id,
          league_id
        )
      `)
      .eq('gameweeks.league_id', leagueId)
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

    // Aggregate goals by player
    const playerGoalsMap = new Map<
      string,
      { totalGoals: number; gameweeks: Set<string> }
    >()

    resultsData?.forEach((result) => {
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

    // Build top scorers array
    const topScorers: TopScorer[] = players
      ?.map((player) => {
        const playerStats = playerGoalsMap.get(player.id)
        if (!playerStats) return null

        const manager = Array.isArray(player.users)
          ? player.users[0]
          : player.users

        const managerName = manager
          ? `${manager.first_name || ''} ${manager.last_name || ''}`.trim() ||
            manager.email
          : 'Brak managera'

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
