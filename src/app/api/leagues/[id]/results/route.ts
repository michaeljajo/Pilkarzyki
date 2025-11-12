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
            last_name,
            email
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

    // Get unique manager IDs from results
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
          email: string
        } | null
      } | null
      gameweek: {
        id: string
        week: number
      } | null
    }

    const managerIds = Array.from(
      new Set(
        (results as unknown as ResultWithRelations[])
          ?.map(r => r.player?.manager?.id)
          .filter(Boolean) as string[]
      )
    )

    // Fetch squad team names for this league
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', managerIds)

    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // Transform the data for easier consumption
    const transformedResults = (results as unknown as ResultWithRelations[])?.map((result) => {
      const manager = result.player?.manager
      const squad = manager ? squadMap.get(manager.id) : null

      let managerName = 'Unassigned'
      if (manager) {
        // Priority: team_name → first_name+last_name → email
        if (squad?.team_name) {
          managerName = squad.team_name
        } else if (manager.first_name || manager.last_name) {
          managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim()
        } else {
          managerName = manager.email
        }
      }

      return {
        id: result.id,
        player_name: result.player?.name || 'Unknown',
        goals: result.goals,
        gameweek_week: result.gameweek?.week || 0,
        manager_name: managerName,
      }
    }) || []

    return NextResponse.json({ results: transformedResults })
  } catch (error) {
    console.error('Error in GET /api/leagues/[id]/results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
