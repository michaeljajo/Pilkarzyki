import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/admin/cup-et-penalty?cupGameweekId=xxx&managerIds=id1,id2,...
 * Fetch ET and penalty lineups for given managers in a cup gameweek.
 * Admin-only endpoint used by the results management page.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cupGameweekId = searchParams.get('cupGameweekId')
    const managerIdsStr = searchParams.get('managerIds')

    if (!cupGameweekId || !managerIdsStr) {
      return NextResponse.json({ error: 'cupGameweekId and managerIds are required' }, { status: 400 })
    }

    const managerIds = managerIdsStr.split(',').filter(Boolean)

    // Fetch ET lineups
    const { data: etLineups } = await supabaseAdmin
      .from('cup_et_lineups')
      .select('*')
      .eq('cup_gameweek_id', cupGameweekId)
      .in('manager_id', managerIds)

    // Fetch penalty lineups
    const { data: penaltyLineups } = await supabaseAdmin
      .from('cup_penalty_lineups')
      .select('*')
      .eq('cup_gameweek_id', cupGameweekId)
      .in('manager_id', managerIds)

    // Collect all player IDs from ET and penalty lineups
    const allPlayerIds = new Set<string>()
    etLineups?.forEach(et => et.player_ids?.forEach((id: string) => allPlayerIds.add(id)))
    penaltyLineups?.forEach(pen => pen.player_ids?.forEach((id: string) => allPlayerIds.add(id)))

    // Fetch player details
    let playersMap: { [id: string]: { id: string; name: string; surname: string; position: string } } = {}
    if (allPlayerIds.size > 0) {
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('id, name, surname, position')
        .in('id', Array.from(allPlayerIds))

      if (players) {
        players.forEach(p => { playersMap[p.id] = p })
      }
    }

    // Fetch existing results for ET players (goals_scored, has_played)
    const etPlayerIds = new Set<string>()
    etLineups?.forEach(et => et.player_ids?.forEach((id: string) => etPlayerIds.add(id)))

    let resultsMap: { [playerId: string]: { goals_scored: number; has_played: boolean } } = {}
    if (etPlayerIds.size > 0) {
      // Get the league gameweek ID for this cup gameweek
      const { data: cupGw } = await supabaseAdmin
        .from('cup_gameweeks')
        .select('league_gameweek_id')
        .eq('id', cupGameweekId)
        .single()

      if (cupGw?.league_gameweek_id) {
        const { data: results } = await supabaseAdmin
          .from('results')
          .select('player_id, goals, has_played')
          .eq('gameweek_id', cupGw.league_gameweek_id)
          .in('player_id', Array.from(etPlayerIds))

        results?.forEach(r => {
          resultsMap[r.player_id] = { goals_scored: r.goals || 0, has_played: r.has_played || false }
        })
      }
    }

    // Enrich ET lineups with player data and results
    const enrichedEtLineups = etLineups?.map(et => ({
      ...et,
      players: et.player_ids?.map((id: string) => ({
        ...playersMap[id],
        goals_scored: resultsMap[id]?.goals_scored || 0,
        has_played: resultsMap[id]?.has_played || false,
      })).filter(Boolean) || []
    })) || []

    // Enrich penalty lineups with player data
    const enrichedPenaltyLineups = penaltyLineups?.map(pen => ({
      ...pen,
      players: pen.player_ids?.map((id: string) => playersMap[id]).filter(Boolean) || []
    })) || []

    return NextResponse.json({
      etLineups: enrichedEtLineups,
      penaltyLineups: enrichedPenaltyLineups
    })
  } catch (error) {
    console.error('Error fetching ET/penalty lineups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
