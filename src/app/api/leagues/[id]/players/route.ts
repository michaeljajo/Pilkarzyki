import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leagueId = params.id

    // First, get the league name from the league ID
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      console.error('Error fetching league:', leagueError)
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    // Fetch all players for this league with their manager information
    // Note: players.league is a TEXT field containing league name, not a foreign key
    const { data: players, error } = await supabaseAdmin
      .from('players')
      .select(`
        id,
        name,
        surname,
        position,
        club,
        league,
        manager:users!players_manager_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('league', league.name)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching players:', error)
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      )
    }

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error in GET /api/leagues/[id]/players:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
