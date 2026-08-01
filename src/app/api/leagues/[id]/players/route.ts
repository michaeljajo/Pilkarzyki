import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchAllPlayersInLeague } from '@/lib/players'

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

    // Fetch all players for this league with their manager information.
    // Note: players.league is a TEXT field containing league name, not a foreign key.
    // Paged, because the league pool exceeds PostgREST's 1000-row response cap.
    let players
    try {
      players = await fetchAllPlayersInLeague(
        league.name,
        `
        id,
        name,
        surname,
        position,
        club,
        league,
        football_league,
        manager:users!players_manager_id_fkey (
          id,
          first_name,
          last_name
        )
      `,
        'name'
      )
    } catch (playersError) {
      console.error('Error fetching players:', playersError)
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
