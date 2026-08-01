import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutableByCup, requireLeagueAdminByCup } from '@/lib/auth-helpers'

// POST /api/admin/cups/[id]/lineups - Create or update cup lineup for a manager
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const cupId = params.id
    const body = await request.json()
    const { managerId, cupGameweekId, playerIds } = body

    if (!managerId || !cupGameweekId || !playerIds || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mutable = await assertLeagueMutableByCup(cupId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    // Authorize against the league_admins table rather than the legacy
    // leagues.admin_id column — that column only names the original creator,
    // so co-admins were wrongly locked out of the lineup override.
    const admin = await requireLeagueAdminByCup(user.id, cupId)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }
    const cupWithLeague = { league_id: admin.leagueId }

    // Validate player count (1-3 players)
    if (playerIds.length < 1 || playerIds.length > 3) {
      return NextResponse.json({ error: 'Lineup must have between 1 and 3 players' }, { status: 400 })
    }

    // Validate all players belong to manager's squad for this league
    const { data: squad } = await supabaseAdmin
      .from('squads')
      .select(`
        id,
        squad_players!inner (
          player_id
        )
      `)
      .eq('manager_id', managerId)
      .eq('league_id', cupWithLeague.league_id)
      .single()

    if (!squad) {
      return NextResponse.json({ error: 'Manager has no squad in this league' }, { status: 404 })
    }

    const squadPlayerIds = (squad.squad_players as Array<{ player_id: string }>).map(sp => sp.player_id)
    const invalidPlayers = playerIds.filter((id: string) => !squadPlayerIds.includes(id))

    if (invalidPlayers.length > 0) {
      return NextResponse.json({
        error: 'Some players are not in manager\'s squad',
        invalidPlayers
      }, { status: 400 })
    }

    // Check if cup lineup already exists
    const { data: existingLineup } = await supabaseAdmin
      .from('cup_lineups')
      .select('id')
      .eq('manager_id', managerId)
      .eq('cup_gameweek_id', cupGameweekId)
      .single()

    if (existingLineup) {
      // Update existing cup lineup
      const { data, error } = await supabaseAdmin
        .from('cup_lineups')
        .update({
          player_ids: playerIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLineup.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating cup lineup:', error)
        return NextResponse.json({ error: 'Failed to update cup lineup' }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Cup lineup updated successfully',
        lineup: data
      })
    } else {
      // Create new cup lineup
      const { data, error } = await supabaseAdmin
        .from('cup_lineups')
        .insert({
          manager_id: managerId,
          cup_gameweek_id: cupGameweekId,
          player_ids: playerIds,
          is_locked: false,
          total_goals: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating cup lineup:', error)
        return NextResponse.json({ error: 'Failed to create cup lineup' }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Cup lineup created successfully',
        lineup: data
      })
    }
  } catch (error) {
    console.error('Error managing cup lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/cups/[id]/lineups - Get all cup lineups for a cup/gameweek
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const cupId = params.id
    const { searchParams } = new URL(request.url)
    const cupGameweekId = searchParams.get('cupGameweekId')

    // Authorize against the league_admins table rather than the legacy
    // leagues.admin_id column — that column only names the original creator,
    // so co-admins were wrongly locked out of the lineup override.
    const admin = await requireLeagueAdminByCup(user.id, cupId)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    // Get all managers in the cup (those assigned to cup groups)
    const { data: cupGroups } = await supabaseAdmin
      .from('cup_groups')
      .select(`
        manager_id,
        users!cup_groups_manager_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('cup_id', cupId)

    if (!cupGroups || cupGroups.length === 0) {
      return NextResponse.json({ managers: [], lineups: [] })
    }

    // Extract unique managers from cup groups
    type CupGroupUser = {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };

    type CupGroupWithUsers = {
      manager_id: string;
      users: CupGroupUser;
    };

    const managers = (cupGroups as unknown as CupGroupWithUsers[])
      .map((group) => group.users)
      .filter((user): user is CupGroupUser => user !== null && user !== undefined)
      .map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email
      }))

    // If cupGameweekId is provided, get lineups for that cup gameweek.
    if (cupGameweekId) {
      // Only managers who actually have a cup match this cup gameweek need a
      // lineup. Managers on a bye (no match row) are excluded so they are not
      // counted as "missing" in the admin progress counters.
      const { data: matchRows } = await supabaseAdmin
        .from('cup_matches')
        .select('home_manager_id, away_manager_id')
        .eq('cup_gameweek_id', cupGameweekId)

      const participantIds = new Set<string>()
      for (const m of matchRows || []) {
        if (m.home_manager_id) participantIds.add(m.home_manager_id)
        if (m.away_manager_id) participantIds.add(m.away_manager_id)
      }

      const playingManagers = managers.filter(m => participantIds.has(m.id))

      const { data: lineups } = await supabaseAdmin
        .from('cup_lineups')
        .select('*')
        .eq('cup_gameweek_id', cupGameweekId)
        .in('manager_id', playingManagers.map(m => m.id))

      return NextResponse.json({ managers: playingManagers, lineups: lineups || [] })
    }

    return NextResponse.json({ managers })
  } catch (error) {
    console.error('Error fetching cup lineups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
