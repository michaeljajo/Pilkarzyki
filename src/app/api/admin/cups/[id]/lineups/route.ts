import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Get admin's internal user ID
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Verify user is admin of this cup's league
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('league_id, leagues!inner(admin_id)')
      .eq('id', cupId)
      .single()

    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Type assertion for Supabase joined data
    type CupWithLeague = {
      league_id: string;
      leagues: {
        admin_id: string;
      };
    };

    const cupWithLeague = cup as unknown as CupWithLeague
    if (cupWithLeague.leagues.admin_id !== adminUser.id) {
      return NextResponse.json({ error: 'Unauthorized - not league admin' }, { status: 403 })
    }

    // Validate player count (max 3 players)
    if (playerIds.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 players allowed in lineup' }, { status: 400 })
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

    // Get admin's internal user ID
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Verify user is admin of this cup's league
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('league_id, leagues!inner(admin_id)')
      .eq('id', cupId)
      .single()

    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Type assertion for Supabase joined data
    type CupWithLeague = {
      league_id: string;
      leagues: {
        admin_id: string;
      };
    };

    const cupWithLeague = cup as unknown as CupWithLeague
    if (cupWithLeague.leagues.admin_id !== adminUser.id) {
      return NextResponse.json({ error: 'Unauthorized - not league admin' }, { status: 403 })
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

    // If cupGameweekId is provided, get lineups for that cup gameweek
    if (cupGameweekId) {
      const { data: lineups } = await supabaseAdmin
        .from('cup_lineups')
        .select('*')
        .eq('cup_gameweek_id', cupGameweekId)
        .in('manager_id', managers.map(m => m.id))

      return NextResponse.json({ managers, lineups: lineups || [] })
    }

    return NextResponse.json({ managers })
  } catch (error) {
    console.error('Error fetching cup lineups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
