import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const leagueId = resolvedParams.id

    // Get user record
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get league details
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, name, admin_id')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if user is admin or has a squad in this league
    const isAdmin = userRecord.is_admin || league.admin_id === userRecord.id

    const { data: userSquad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', leagueId)
      .eq('manager_id', userRecord.id)
      .single()

    if (!isAdmin && !userSquad) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all squads for this league with manager information
    const { data: squads, error: squadsError } = await supabaseAdmin
      .from('squads')
      .select(`
        id,
        manager_id,
        league_id,
        team_name,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('league_id', leagueId)
      .order('team_name', { ascending: true, nullsFirst: false })

    if (squadsError) {
      console.error('Error fetching squads:', squadsError)
      return NextResponse.json({ error: squadsError.message }, { status: 500 })
    }

    // Check if league has a cup
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('id, name')
      .eq('league_id', leagueId)
      .single()

    // For each squad, fetch players and default lineups
    const squadDetails = await Promise.all(
      (squads || []).map(async (squad) => {
        // Get players for this manager
        const { data: players } = await supabaseAdmin
          .from('players')
          .select('id, name, surname, position, club')
          .eq('manager_id', squad.manager_id)
          .eq('league', league.name)
          .order('position')
          .order('surname')

        // Get default league lineup
        const { data: defaultLineup } = await supabaseAdmin
          .from('default_lineups')
          .select('id, player_ids')
          .eq('manager_id', squad.manager_id)
          .eq('league_id', leagueId)
          .single()

        // Get default cup lineup if cup exists
        let defaultCupLineup = null
        if (cup) {
          const { data: cupLineup } = await supabaseAdmin
            .from('default_cup_lineups')
            .select('id, player_ids')
            .eq('manager_id', squad.manager_id)
            .eq('cup_id', cup.id)
            .single()

          defaultCupLineup = cupLineup
        }

        // Map player IDs to player details for default lineups
        let defaultLineupPlayers: any[] = []
        if (defaultLineup && defaultLineup.player_ids && players) {
          defaultLineupPlayers = defaultLineup.player_ids
            .map(playerId => players.find(p => p.id === playerId))
            .filter(Boolean)
        }

        let defaultCupLineupPlayers: any[] = []
        if (defaultCupLineup && defaultCupLineup.player_ids && players) {
          defaultCupLineupPlayers = defaultCupLineup.player_ids
            .map(playerId => players.find(p => p.id === playerId))
            .filter(Boolean)
        }

        return {
          squadId: squad.id,
          teamName: squad.team_name,
          manager: squad.users,
          players: players || [],
          defaultLineup: defaultLineupPlayers,
          defaultCupLineup: defaultCupLineupPlayers,
        }
      })
    )

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name
      },
      hasCup: !!cup,
      cupName: cup?.name,
      squads: squadDetails
    })
  } catch (error) {
    console.error('Error in squads API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
