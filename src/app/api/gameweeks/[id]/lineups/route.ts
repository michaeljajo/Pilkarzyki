import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recalculateLeagueStandings } from '@/utils/standings-calculator'

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

    // Get matches for this gameweek
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
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
        ),
        gameweeks(
          id,
          week,
          league_id,
          leagues(name, season)
        )
      `)
      .eq('gameweek_id', gameweekId)
      .order('id', { ascending: true })

    if (matchError) {
      console.error('Error fetching matches:', matchError)
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    // Get all lineups for this gameweek with manager and player details
    const { data: lineups, error } = await supabaseAdmin
      .from('lineups')
      .select(`
        *,
        users!lineups_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        gameweeks(
          id,
          week,
          league_id,
          leagues(name, season)
        )
      `)
      .eq('gameweek_id', gameweekId)

    if (error) {
      console.error('Error fetching lineups:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // OPTIMIZED: Batch fetch all players and results to avoid N+1 queries
    // Collect all unique player IDs across all lineups
    const allPlayerIds = Array.from(
      new Set(
        (lineups || [])
          .flatMap(lineup => lineup.player_ids || [])
          .filter(Boolean)
      )
    )

    // Batch fetch all players
    let playersMap = new Map()
    if (allPlayerIds.length > 0) {
      const { data: players, error: playersError } = await supabaseAdmin
        .from('players')
        .select('*')
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

    // Map lineups with their players and results (no more async operations)
    const lineupsWithPlayers = (lineups || []).map(lineup => {
      if (!lineup.player_ids || lineup.player_ids.length === 0) {
        return {
          ...lineup,
          players: []
        }
      }

      const playersWithResults = lineup.player_ids
        .map((playerId: string) => {
          const player = playersMap.get(playerId)
          if (!player) return null

          return {
            ...player,
            goals_scored: resultsMap.get(playerId) || 0
          }
        })
        .filter(Boolean)

      return {
        ...lineup,
        players: playersWithResults
      }
    })

    return NextResponse.json({
      lineups: lineupsWithPlayers,
      matches: matches || []
    })
  } catch (error) {
    console.error('Error in gameweek lineups API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameweekId } = await params
    const { results } = await request.json()

    if (!Array.isArray(results)) {
      return NextResponse.json({
        error: 'Results must be an array of { player_id, goals } objects'
      }, { status: 400 })
    }

    // Start a transaction-like operation
    const resultPromises = results.map(async ({ player_id, goals }) => {
      const { error } = await supabaseAdmin
        .from('results')
        .upsert({
          gameweek_id: gameweekId,
          player_id,
          goals: parseInt(goals) || 0
        }, {
          onConflict: 'gameweek_id,player_id'
        })

      if (error) {
        console.error('Error updating result:', error)
        throw error
      }
    })

    await Promise.all(resultPromises)

    // OPTIMIZED: Batch fetch all results once for lineup updates
    const { data: lineups } = await supabaseAdmin
      .from('lineups')
      .select('id, player_ids')
      .eq('gameweek_id', gameweekId)

    if (lineups && lineups.length > 0) {
      // Fetch all results for this gameweek once
      const { data: allResults } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', gameweekId)

      const resultsMap = new Map(allResults?.map(r => [r.player_id, r.goals]) || [])

      // Calculate totals and prepare batch update
      const lineupUpdates = lineups.map(lineup => {
        if (!lineup.player_ids || lineup.player_ids.length === 0) {
          return { id: lineup.id, total_goals: 0 }
        }

        const totalGoals = lineup.player_ids.reduce((sum: number, playerId: string) => {
          return sum + (resultsMap.get(playerId) || 0)
        }, 0)

        return { id: lineup.id, total_goals: totalGoals }
      })

      // Batch update all lineups
      for (const update of lineupUpdates) {
        const { error } = await supabaseAdmin
          .from('lineups')
          .update({ total_goals: update.total_goals })
          .eq('id', update.id)

        if (error) {
          console.error('Error updating lineup total:', error)
        }
      }
    }

    // OPTIMIZED: Update match scores using already-fetched data
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('id, home_manager_id, away_manager_id')
      .eq('gameweek_id', gameweekId)

    if (matches && matches.length > 0) {
      // Fetch all lineups for this gameweek once (if not already fetched)
      const { data: allGameweekLineups } = await supabaseAdmin
        .from('lineups')
        .select('manager_id, player_ids')
        .eq('gameweek_id', gameweekId)

      // Create a map of manager_id -> lineup
      const lineupsMapByManager = new Map(
        allGameweekLineups?.map(l => [l.manager_id, l]) || []
      )

      // We already have resultsMap from the lineup updates above
      // Reuse it or fetch again if needed
      const { data: allResults } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', gameweekId)

      const resultsMap = new Map(allResults?.map(r => [r.player_id, r.goals]) || [])

      // Calculate match scores without additional queries
      const matchUpdates = matches.map(match => {
        const homeLineup = lineupsMapByManager.get(match.home_manager_id)
        const awayLineup = lineupsMapByManager.get(match.away_manager_id)

        let homeScore = 0
        let awayScore = 0

        if (homeLineup?.player_ids && homeLineup.player_ids.length > 0) {
          homeScore = homeLineup.player_ids.reduce((sum: number, playerId: string) => {
            return sum + (resultsMap.get(playerId) || 0)
          }, 0)
        }

        if (awayLineup?.player_ids && awayLineup.player_ids.length > 0) {
          awayScore = awayLineup.player_ids.reduce((sum: number, playerId: string) => {
            return sum + (resultsMap.get(playerId) || 0)
          }, 0)
        }

        return {
          id: match.id,
          home_score: homeScore,
          away_score: awayScore,
          is_completed: true
        }
      })

      // Batch update all matches
      for (const update of matchUpdates) {
        const { error } = await supabaseAdmin
          .from('matches')
          .update({
            home_score: update.home_score,
            away_score: update.away_score,
            is_completed: update.is_completed
          })
          .eq('id', update.id)

        if (error) {
          console.error('Error updating match score:', error)
        }
      }
    }

    // Recalculate league standings after updating match results
    try {
      // Get the league ID from the gameweek
      const { data: gameweek } = await supabaseAdmin
        .from('gameweeks')
        .select('league_id')
        .eq('id', gameweekId)
        .single()

      if (gameweek?.league_id) {
        console.log('Recalculating league standings for league:', gameweek.league_id)
        await recalculateLeagueStandings(gameweek.league_id)
        console.log('League standings updated successfully')
      }
    } catch (standingsError) {
      console.error('Error updating league standings:', standingsError)
      // Don't fail the entire request if standings update fails
    }

    return NextResponse.json({ message: 'Results updated successfully' })
  } catch (error) {
    console.error('Error in gameweek lineups PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}