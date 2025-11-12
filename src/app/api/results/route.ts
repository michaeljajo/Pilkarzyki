import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recalculateLeagueStandings } from '@/utils/standings-calculator'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const gameweekId = searchParams.get('gameweek_id')

    let query = supabaseAdmin
      .from('results')
      .select(`
        *,
        players:player_id (
          id,
          name,
          surname,
          position
        ),
        gameweeks:gameweek_id (
          id,
          week,
          league_id,
          leagues:league_id (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (gameweekId) {
      query = query.eq('gameweek_id', gameweekId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ results: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameweek_id, player_id, goals } = await request.json()

    if (!gameweek_id || !player_id || goals === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: gameweek_id, player_id, goals'
      }, { status: 400 })
    }

    // Get gameweek and league info for later standings recalculation
    const { data: gameweek } = await supabaseAdmin
      .from('gameweeks')
      .select('id, league_id')
      .eq('id', gameweek_id)
      .single()

    // Check if result already exists for this player and gameweek
    const { data: existingResult } = await supabaseAdmin
      .from('results')
      .select('id')
      .eq('gameweek_id', gameweek_id)
      .eq('player_id', player_id)
      .single()

    let resultData
    if (existingResult) {
      // Update existing result
      const { data, error } = await supabaseAdmin
        .from('results')
        .update({ goals })
        .eq('gameweek_id', gameweek_id)
        .eq('player_id', player_id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      resultData = data
    } else {
      // Create new result
      const { data, error } = await supabaseAdmin
        .from('results')
        .insert({
          gameweek_id,
          player_id,
          goals
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      resultData = data
    }

    // Recalculate match scores and standings after result is saved
    if (gameweek?.league_id) {
      try {
        // Get all matches for this gameweek
        const { data: matches } = await supabaseAdmin
          .from('matches')
          .select('id, home_manager_id, away_manager_id')
          .eq('gameweek_id', gameweek_id)

        if (matches && matches.length > 0) {
          // Get all lineups for this gameweek
          const { data: allLineups } = await supabaseAdmin
            .from('lineups')
            .select('manager_id, player_ids')
            .eq('gameweek_id', gameweek_id)

          const lineupsMap = new Map(
            allLineups?.map(l => [l.manager_id, l]) || []
          )

          // Get all results for this gameweek
          const { data: allResults } = await supabaseAdmin
            .from('results')
            .select('player_id, goals')
            .eq('gameweek_id', gameweek_id)

          const resultsMap = new Map(allResults?.map(r => [r.player_id, r.goals]) || [])

          // Calculate and update match scores
          for (const match of matches) {
            const homeLineup = lineupsMap.get(match.home_manager_id)
            const awayLineup = lineupsMap.get(match.away_manager_id)

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

            // Update match scores
            await supabaseAdmin
              .from('matches')
              .update({
                home_score: homeScore,
                away_score: awayScore,
                is_completed: true
              })
              .eq('id', match.id)
          }
        }

        // Recalculate league standings
        console.log('Recalculating league standings for league:', gameweek.league_id)
        await recalculateLeagueStandings(gameweek.league_id)
        console.log('League standings updated successfully after result entry')
      } catch (standingsError) {
        console.error('Error updating match scores and standings:', standingsError)
        // Don't fail the request if standings update fails
      }
    }

    return NextResponse.json({ result: resultData })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}