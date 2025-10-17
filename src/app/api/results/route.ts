import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Check if result already exists for this player and gameweek
    const { data: existingResult } = await supabaseAdmin
      .from('results')
      .select('id')
      .eq('gameweek_id', gameweek_id)
      .eq('player_id', player_id)
      .single()

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

      return NextResponse.json({ result: data })
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

      return NextResponse.json({ result: data })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}