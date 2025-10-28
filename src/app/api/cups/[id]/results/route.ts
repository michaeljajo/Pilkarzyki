import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/cups/[id]/results
 * Fetch all cup matches with lineups, players, and results
 * Returns matches grouped by cup gameweek
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

    const { id: cupId } = await context.params

    // Get cup details
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select(`
        id,
        name,
        stage,
        league_id,
        leagues:league_id (
          id,
          name,
          season
        )
      `)
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a member of this league (has a squad)
    const { data: userSquad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', cup.league_id)
      .eq('manager_id', userRecord.id)
      .single()

    if (!userSquad) {
      return NextResponse.json({ error: 'Access denied. You are not a member of this league.' }, { status: 403 })
    }

    // Fetch all cup gameweeks with matches
    const { data: cupGameweeks, error: gameweeksError } = await supabaseAdmin
      .from('cup_gameweeks')
      .select(`
        id,
        cup_week,
        stage,
        leg,
        gameweeks:league_gameweek_id (
          id,
          week,
          start_date,
          end_date,
          lock_date,
          is_completed
        ),
        cup_matches (
          id,
          home_manager_id,
          away_manager_id,
          stage,
          leg,
          group_name,
          home_score,
          away_score,
          home_aggregate_score,
          away_aggregate_score,
          is_completed,
          winner_id
        )
      `)
      .eq('cup_id', cupId)
      .order('cup_week', { ascending: true })

    if (gameweeksError) {
      return NextResponse.json({ error: gameweeksError.message }, { status: 500 })
    }

    // Collect all unique manager IDs from matches
    const managerIds = new Set<string>()
    cupGameweeks?.forEach((gw) => {
      gw.cup_matches?.forEach((match) => {
        managerIds.add(match.home_manager_id)
        managerIds.add(match.away_manager_id)
      })
    })

    // Fetch user data for all managers
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', Array.from(managerIds))

    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    // Fetch all cup lineups for this cup
    const cupGameweekIds = cupGameweeks?.map((gw) => gw.id) || []
    const { data: allCupLineups } = await supabaseAdmin
      .from('cup_lineups')
      .select(`
        id,
        manager_id,
        cup_gameweek_id,
        player_ids,
        total_goals
      `)
      .in('cup_gameweek_id', cupGameweekIds)

    // Create map of cup_gameweek_id + manager_id -> lineup
    const lineupsMap = new Map(
      allCupLineups?.map(l => [`${l.cup_gameweek_id}_${l.manager_id}`, l]) || []
    )

    // Collect all unique player IDs
    const allPlayerIds = Array.from(
      new Set(
        (allCupLineups || [])
          .flatMap(lineup => lineup.player_ids || [])
          .filter(Boolean)
      )
    )

    // Batch fetch all players
    const playersMap = new Map()
    if (allPlayerIds.length > 0) {
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('id, name, surname, position, manager_id')
        .in('id', allPlayerIds)

      players?.forEach(p => playersMap.set(p.id, p))
    }

    // Batch fetch all results for all gameweeks
    const leagueGameweekIds = cupGameweeks
      ?.map((gw) => gw.gameweeks?.id)
      .filter(Boolean) || []

    const resultsMap = new Map()
    if (allPlayerIds.length > 0 && leagueGameweekIds.length > 0) {
      const { data: results } = await supabaseAdmin
        .from('results')
        .select('player_id, gameweek_id, goals')
        .in('gameweek_id', leagueGameweekIds)
        .in('player_id', allPlayerIds)

      results?.forEach(r => {
        resultsMap.set(`${r.gameweek_id}_${r.player_id}`, r.goals)
      })
    }

    // Build response with all data
    const gameweeksWithMatches = cupGameweeks?.map((gw) => {
      const matchesWithLineups = gw.cup_matches?.map((match) => {
        const homeLineup = lineupsMap.get(`${gw.id}_${match.home_manager_id}`)
        const awayLineup = lineupsMap.get(`${gw.id}_${match.away_manager_id}`)

        // Build home lineup with players and results
        let homeLineupWithPlayers = null
        if (homeLineup && homeLineup.player_ids?.length > 0) {
          const homePlayersWithResults = homeLineup.player_ids
            .map((playerId) => {
              const player = playersMap.get(playerId)
              if (!player) return null

              const goals = resultsMap.get(`${gw.gameweeks?.id}_${playerId}`) || 0
              return {
                ...player,
                goals_scored: goals
              }
            })
            .filter(Boolean)

          homeLineupWithPlayers = {
            ...homeLineup,
            players: homePlayersWithResults
          }
        }

        // Build away lineup with players and results
        let awayLineupWithPlayers = null
        if (awayLineup && awayLineup.player_ids?.length > 0) {
          const awayPlayersWithResults = awayLineup.player_ids
            .map((playerId) => {
              const player = playersMap.get(playerId)
              if (!player) return null

              const goals = resultsMap.get(`${gw.gameweeks?.id}_${playerId}`) || 0
              return {
                ...player,
                goals_scored: goals
              }
            })
            .filter(Boolean)

          awayLineupWithPlayers = {
            ...awayLineup,
            players: awayPlayersWithResults
          }
        }

        return {
          ...match,
          home_manager: userMap.get(match.home_manager_id),
          away_manager: userMap.get(match.away_manager_id),
          home_lineup: homeLineupWithPlayers,
          away_lineup: awayLineupWithPlayers
        }
      })

      return {
        id: gw.id,
        cup_week: gw.cup_week,
        stage: gw.stage,
        leg: gw.leg,
        gameweek: gw.gameweeks,
        matches: matchesWithLineups
      }
    })

    return NextResponse.json({
      cup,
      gameweeks: gameweeksWithMatches || []
    })
  } catch (error) {
    console.error('Error fetching cup results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
