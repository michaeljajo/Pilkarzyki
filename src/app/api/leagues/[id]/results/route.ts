import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { batchGetManagersAtGameweek } from '@/utils/transfer-resolver'

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

    // Fetch all results for this league with player and gameweek info
    // NOTE: We don't join manager here anymore - we resolve it via transfer history
    const { data: results, error } = await supabaseAdmin
      .from('results')
      .select(`
        id,
        goals,
        player_id,
        gameweek_id,
        player:players!results_player_id_fkey (
          id,
          name,
          surname
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

    interface ResultWithRelations {
      id: string
      goals: number
      player_id: string
      gameweek_id: string
      player: {
        id: string
        name: string
        surname: string
      } | null
      gameweek: {
        id: string
        week: number
      } | null
    }

    const typedResults = results as unknown as ResultWithRelations[]

    if (!typedResults || typedResults.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Group results by gameweek for batch resolution
    const gameweekPlayerMap = new Map<string, Set<string>>()
    for (const result of typedResults) {
      if (!gameweekPlayerMap.has(result.gameweek_id)) {
        gameweekPlayerMap.set(result.gameweek_id, new Set())
      }
      gameweekPlayerMap.get(result.gameweek_id)!.add(result.player_id)
    }

    // Resolve historical managers for each gameweek
    const historicalManagerMap = new Map<string, string | null>()
    for (const [gameweekId, playerIds] of gameweekPlayerMap.entries()) {
      const managerMap = await batchGetManagersAtGameweek(
        Array.from(playerIds),
        gameweekId,
        leagueId
      )
      // Store with composite key: gameweek_id:player_id
      for (const [playerId, managerId] of managerMap.entries()) {
        historicalManagerMap.set(`${gameweekId}:${playerId}`, managerId)
      }
    }

    // Get all unique manager IDs from historical data
    const managerIds = Array.from(
      new Set(
        Array.from(historicalManagerMap.values()).filter(Boolean) as string[]
      )
    )

    // Fetch manager details and squad names
    const { data: managers } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', managerIds)

    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', managerIds)

    const managerMap = new Map(managers?.map(m => [m.id, m]) || [])
    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // Transform results with historical manager information
    const transformedResults = typedResults.map((result) => {
      const compositeKey = `${result.gameweek_id}:${result.player_id}`
      const managerId = historicalManagerMap.get(compositeKey)
      const manager = managerId ? managerMap.get(managerId) : null
      const squad = managerId ? squadMap.get(managerId) : null

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

      const playerFullName = result.player
        ? `${result.player.name} ${result.player.surname}`.trim()
        : 'Unknown'

      return {
        id: result.id,
        player_name: playerFullName,
        goals: result.goals,
        gameweek_week: result.gameweek?.week || 0,
        manager_name: managerName,
      }
    })

    return NextResponse.json({ results: transformedResults })
  } catch (error) {
    console.error('Error in GET /api/leagues/[id]/results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
