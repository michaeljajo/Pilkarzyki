import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateLineupTotalGoals } from '@/utils/own-goal-calculator'

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

    // Fetch squads for all managers in these matches to get team names
    const managerIds = Array.from(
      new Set(
        (matches || []).flatMap(m => [m.home_manager_id, m.away_manager_id])
      )
    )

    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', gameweek.league_id)
      .in('manager_id', managerIds)

    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

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
        is_from_default,
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
      // CRITICAL: Filter by league to prevent cross-league player confusion
      const { data: players, error: playersError } = await supabaseAdmin
        .from('players')
        .select('id, name, surname, position, manager_id')
        .in('id', allPlayerIds)
        .eq('league', (gameweek.leagues as any).name)

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
        .select('player_id, goals, has_played')
        .eq('gameweek_id', gameweekId)
        .in('player_id', allPlayerIds)

      if (resultsError) {
        console.error('Error fetching results:', resultsError)
      } else {
        resultsMap = new Map(results?.map(r => [r.player_id, { goals: r.goals, has_played: r.has_played }]) || [])
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
          .map((playerId: string) => {
            const player = playersMap.get(playerId)
            if (!player) return null

            const result = resultsMap.get(playerId)
            return {
              ...player,
              goals_scored: result?.goals || 0,
              has_played: result?.has_played || false
            }
          })
          .filter(Boolean)

        // Calculate actual total goals from results (excluding own goals)
        const playerGoalsMap = new Map(
          homePlayersWithResults.map(p => [p.id, p.goals_scored || 0])
        )
        const calculatedTotalGoals = calculateLineupTotalGoals(
          homeLineup.player_ids,
          playerGoalsMap
        )

        homeLineupWithPlayers = {
          ...homeLineup,
          total_goals: calculatedTotalGoals, // Override with calculated value
          players: homePlayersWithResults
        }
      }

      // Build away lineup with players
      let awayLineupWithPlayers = null
      if (awayLineup && awayLineup.player_ids?.length > 0) {
        const awayPlayersWithResults = awayLineup.player_ids
          .map((playerId: string) => {
            const player = playersMap.get(playerId)
            if (!player) return null

            const result = resultsMap.get(playerId)
            return {
              ...player,
              goals_scored: result?.goals || 0,
              has_played: result?.has_played || false
            }
          })
          .filter(Boolean)

        // Calculate actual total goals from results (excluding own goals)
        const playerGoalsMap = new Map(
          awayPlayersWithResults.map(p => [p.id, p.goals_scored || 0])
        )
        const calculatedTotalGoals = calculateLineupTotalGoals(
          awayLineup.player_ids,
          playerGoalsMap
        )

        awayLineupWithPlayers = {
          ...awayLineup,
          total_goals: calculatedTotalGoals, // Override with calculated value
          players: awayPlayersWithResults
        }
      }

      // Add squad data to managers
      const homeSquad = squadMap.get(match.home_manager_id)
      const awaySquad = squadMap.get(match.away_manager_id)

      return {
        ...match,
        home_manager: {
          ...match.home_manager,
          squad: homeSquad || null
        },
        away_manager: {
          ...match.away_manager,
          squad: awaySquad || null
        },
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