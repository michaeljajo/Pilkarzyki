import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameweekId } = await params

    // First, get the gameweek info
    const { data: gameweek, error: gameweekError } = await supabaseAdmin
      .from('gameweeks')
      .select(`
        id,
        week,
        league_id,
        leagues:league_id (
          name,
          season
        )
      `)
      .eq('id', gameweekId)
      .single()

    if (gameweekError || !gameweek) {
      return NextResponse.json({ error: 'Gameweek not found' }, { status: 404 })
    }

    // Get matches for this gameweek with manager details
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(`
        id,
        gameweek_id,
        home_manager_id,
        away_manager_id,
        home_score,
        away_score,
        is_completed,
        home_manager:users!matches_home_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        away_manager:users!matches_away_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('gameweek_id', gameweekId)
      .order('id', { ascending: true })

    if (matchError) {
      console.error('Error fetching matches:', matchError)
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    // OPTIMIZED: Batch fetch all lineups, players, and results to avoid N+1 queries
    // Fetch all lineups for this gameweek once
    const { data: allLineups, error: lineupsError } = await supabaseAdmin
      .from('lineups')
      .select(`
        id,
        manager_id,
        gameweek_id,
        player_ids,
        total_goals,
        manager:users!lineups_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('gameweek_id', gameweekId)

    if (lineupsError) {
      console.error('Error fetching lineups:', lineupsError)
      return NextResponse.json({ error: lineupsError.message }, { status: 500 })
    }

    // Create a map of manager_id -> lineup
    const lineupsMap = new Map(allLineups?.map(l => [l.manager_id, l]) || [])

    // Collect all unique player IDs from all lineups
    const allPlayerIds = Array.from(
      new Set(
        (allLineups || [])
          .flatMap(lineup => lineup.player_ids || [])
          .filter(Boolean)
      )
    )

    // Batch fetch all players
    let playersMap = new Map()
    if (allPlayerIds.length > 0) {
      const { data: players, error: playersError } = await supabaseAdmin
        .from('players')
        .select('id, name, surname, position, manager_id')
        .in('id', allPlayerIds)

      if (playersError) {
        console.error('Error fetching players:', playersError)
      } else {
        playersMap = new Map(players?.map(p => [p.id, p]) || [])
      }
    }

    // Batch fetch all results for this gameweek
    let resultsMap = new Map()
    if (allPlayerIds.length > 0) {
      const { data: results, error: resultsError } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', gameweekId)
        .in('player_id', allPlayerIds)

      if (resultsError) {
        console.error('Error fetching results:', resultsError)
      } else {
        resultsMap = new Map(results?.map(r => [r.player_id, r.goals]) || [])
      }
    }

    // Map matches with their lineups (no more async operations!)
    const matchesWithLineups = (matches || []).map(match => {
      const homeLineup = lineupsMap.get(match.home_manager_id)
      const awayLineup = lineupsMap.get(match.away_manager_id)

      // Build home lineup with players
      let homeLineupWithPlayers = null
      if (homeLineup && homeLineup.player_ids?.length > 0) {
        const homePlayersWithResults = homeLineup.player_ids
          .map(playerId => {
            const player = playersMap.get(playerId)
            if (!player) return null

            return {
              ...player,
              goals_scored: resultsMap.get(playerId) || 0
            }
          })
          .filter(Boolean)

        homeLineupWithPlayers = {
          ...homeLineup,
          players: homePlayersWithResults
        }
      }

      // Build away lineup with players
      let awayLineupWithPlayers = null
      if (awayLineup && awayLineup.player_ids?.length > 0) {
        const awayPlayersWithResults = awayLineup.player_ids
          .map(playerId => {
            const player = playersMap.get(playerId)
            if (!player) return null

            return {
              ...player,
              goals_scored: resultsMap.get(playerId) || 0
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
        home_lineup: homeLineupWithPlayers,
        away_lineup: awayLineupWithPlayers
      }
    })

    return NextResponse.json({
      gameweek,
      matches: matchesWithLineups
    })
  } catch (error) {
    console.error('Error in matches-with-lineups API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}