import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TopScorer } from '@/types'

/**
 * GET /api/leagues/[id]/cup/top-scorers
 * Fetch top scorers for cup competition
 * Returns players with their total goals in cup matches sorted by goals descending
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

    // Get league name
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const leagueName = league.name

    // Verify user is a member of this league (has a squad)
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

    // Get cup for this league
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('id, name')
      .eq('league_id', leagueId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json(
        { error: 'No cup found for this league' },
        { status: 404 }
      )
    }

    // Get all cup gameweeks for this cup
    const { data: cupGameweeks, error: cupGameweeksError } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id, league_gameweek_id')
      .eq('cup_id', cup.id)

    if (cupGameweeksError) {
      console.error('Error fetching cup gameweeks:', cupGameweeksError)
      return NextResponse.json(
        { error: 'Failed to fetch cup gameweeks' },
        { status: 500 }
      )
    }

    if (!cupGameweeks || cupGameweeks.length === 0) {
      // No cup gameweeks yet
      return NextResponse.json({ topScorers: [] })
    }

    // Get all cup lineups to determine which players participated in cup matches
    const cupGameweekIds = cupGameweeks.map((gw) => gw.id)
    const { data: cupLineups, error: cupLineupsError } = await supabaseAdmin
      .from('cup_lineups')
      .select('player_ids, cup_gameweek_id')
      .in('cup_gameweek_id', cupGameweekIds)

    if (cupLineupsError) {
      console.error('Error fetching cup lineups:', cupLineupsError)
      return NextResponse.json(
        { error: 'Failed to fetch cup lineups' },
        { status: 500 }
      )
    }

    // Build a map of cup_gameweek_id -> league_gameweek_id
    const cupToLeagueGameweekMap = new Map<string, string>()
    cupGameweeks.forEach((gw) => {
      cupToLeagueGameweekMap.set(gw.id, gw.league_gameweek_id)
    })

    // Build a map of (league_gameweek_id + player_id) -> true for players in cup lineups
    const cupPlayersSet = new Set<string>()
    cupLineups?.forEach((lineup) => {
      const leagueGameweekId = cupToLeagueGameweekMap.get(
        lineup.cup_gameweek_id
      )
      if (leagueGameweekId) {
        lineup.player_ids?.forEach((playerId: string) => {
          cupPlayersSet.add(`${leagueGameweekId}_${playerId}`)
        })
      }
    })

    if (cupPlayersSet.size === 0) {
      // No players in cup lineups yet
      return NextResponse.json({ topScorers: [] })
    }

    // Get league gameweek IDs
    const leagueGameweekIds = cupGameweeks.map((gw) => gw.league_gameweek_id)

    // Fetch results for those gameweeks
    const { data: resultsData, error: resultsError } = await supabaseAdmin
      .from('results')
      .select('player_id, goals, gameweek_id')
      .in('gameweek_id', leagueGameweekIds)
      .gt('goals', 0)

    if (resultsError) {
      console.error('Error fetching results:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    // Filter results to only include players who were in cup lineups
    // and aggregate goals by player
    const playerGoalsMap = new Map<
      string,
      { totalGoals: number; gameweeks: Set<string> }
    >()

    resultsData?.forEach((result) => {
      const key = `${result.gameweek_id}_${result.player_id}`

      // Only count if player was in a cup lineup for this gameweek
      if (cupPlayersSet.has(key)) {
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
      // No goals scored in cup yet
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
    console.error('Error in cup top scorers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
