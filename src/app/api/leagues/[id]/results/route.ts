import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const leagueId = params.id

    // Fetch all results for this league
    const { data: results, error } = await supabaseAdmin
      .from('results')
      .select(`
        id,
        goals,
        player:players!results_player_id_fkey (
          id,
          name,
          manager:users!players_manager_id_fkey (
            id,
            first_name,
            last_name
          )
        ),
        gameweek:gameweeks!results_gameweek_id_fkey (
          id,
          week
        )
      `)
      .eq('league_id', leagueId)
      .order('gameweek(week)', { ascending: false })

    if (error) {
      console.error('Error fetching results:', error)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    // Transform the data for easier consumption
    interface ResultWithRelations {
      id: string
      goals: number
      player: {
        id: string
        name: string
        manager: {
          id: string
          first_name: string | null
          last_name: string | null
        } | null
      } | null
      gameweek: {
        id: string
        week: number
      } | null
    }

    const transformedResults = results?.map((result: ResultWithRelations) => ({
      id: result.id,
      player_name: result.player?.name || 'Unknown',
      goals: result.goals,
      gameweek_week: result.gameweek?.week || 0,
      manager_name: result.player?.manager
        ? `${result.player.manager.first_name} ${result.player.manager.last_name}`
        : 'Unassigned',
    })) || []

    return NextResponse.json({ results: transformedResults })
  } catch (error) {
    console.error('Error in GET /api/leagues/[id]/results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
