import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')

    let query = supabaseAdmin
      .from('gameweeks')
      .select(`
        *,
        leagues(id, name, season)
      `)
      .order('start_date', { ascending: true })

    if (leagueId) {
      query = query.eq('league_id', leagueId)
    }

    const { data: gameweeks, error } = await query

    if (error) {
      console.error('Error fetching gameweeks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ gameweeks: gameweeks || [] })
  } catch (error) {
    console.error('Error in gameweeks API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gameweekData = await request.json()
    const { league_id, week, start_date, end_date, lock_date } = gameweekData

    // Validate required fields
    if (!league_id || !week || !start_date || !end_date) {
      return NextResponse.json({
        error: 'Missing required fields: league_id, week, start_date, end_date'
      }, { status: 400 })
    }

    // Check if gameweek already exists for this league and week
    const { data: existing } = await supabaseAdmin
      .from('gameweeks')
      .select('id')
      .eq('league_id', league_id)
      .eq('week', week)
      .single()

    if (existing) {
      return NextResponse.json({
        error: `Gameweek ${week} already exists for this league`
      }, { status: 400 })
    }

    // Create the gameweek
    const { data: gameweek, error } = await supabaseAdmin
      .from('gameweeks')
      .insert({
        league_id,
        week: parseInt(week),
        start_date,
        end_date,
        lock_date: lock_date || end_date,
        is_completed: false
      })
      .select(`
        *,
        leagues(id, name, season)
      `)
      .single()

    if (error) {
      console.error('Error creating gameweek:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ gameweek })
  } catch (error) {
    console.error('Error in gameweeks POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}