import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable, requireLeagueAdmin } from '@/lib/auth-helpers'

// POST /api/admin/leagues/[id]/lineups - Create or update lineup for a manager
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
    const leagueId = params.id
    const body = await request.json()
    const { managerId, gameweekId, playerIds } = body

    if (!managerId || !gameweekId || !playerIds || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    // Authorize against the league_admins table rather than the legacy
    // leagues.admin_id column — that column only names the original creator,
    // so co-admins were wrongly locked out of the lineup override.
    const admin = await requireLeagueAdmin(user.id, leagueId)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }
    const adminUser = { id: admin.userInternalId }

    // Validate player count (1-3 players)
    if (playerIds.length < 1 || playerIds.length > 3) {
      return NextResponse.json({ error: 'Lineup must have between 1 and 3 players' }, { status: 400 })
    }

    // Validate all players belong to manager's squad
    const { data: squad } = await supabaseAdmin
      .from('squads')
      .select(`
        id,
        squad_players!inner (
          player_id
        )
      `)
      .eq('manager_id', managerId)
      .eq('league_id', leagueId)
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

    // Check if lineup already exists
    const { data: existingLineup } = await supabaseAdmin
      .from('lineups')
      .select('id')
      .eq('manager_id', managerId)
      .eq('gameweek_id', gameweekId)
      .single()

    if (existingLineup) {
      // Update existing lineup
      const { data, error } = await supabaseAdmin
        .from('lineups')
        .update({
          player_ids: playerIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLineup.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating lineup:', error)
        return NextResponse.json({ error: 'Failed to update lineup' }, { status: 500 })
      }

      // Log lineup change to history table (admin created)
      await supabaseAdmin
        .from('lineup_history')
        .insert({
          manager_id: managerId,
          gameweek_id: gameweekId,
          player_ids: playerIds,
          created_by_admin: true,
          admin_creator_id: adminUser.id
        })

      return NextResponse.json({
        message: 'Lineup updated successfully',
        lineup: data
      })
    } else {
      // Create new lineup
      const { data, error } = await supabaseAdmin
        .from('lineups')
        .insert({
          manager_id: managerId,
          gameweek_id: gameweekId,
          player_ids: playerIds,
          is_locked: false,
          total_goals: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lineup:', error)
        return NextResponse.json({ error: 'Failed to create lineup' }, { status: 500 })
      }

      // Log lineup change to history table (admin created)
      await supabaseAdmin
        .from('lineup_history')
        .insert({
          manager_id: managerId,
          gameweek_id: gameweekId,
          player_ids: playerIds,
          created_by_admin: true,
          admin_creator_id: adminUser.id
        })

      return NextResponse.json({
        message: 'Lineup created successfully',
        lineup: data
      })
    }
  } catch (error) {
    console.error('Error managing lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/leagues/[id]/lineups - Get all lineups for a league/gameweek
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
    const leagueId = params.id
    const { searchParams } = new URL(request.url)
    const gameweekId = searchParams.get('gameweekId')

    // Authorize against the league_admins table rather than the legacy
    // leagues.admin_id column — that column only names the original creator,
    // so co-admins were wrongly locked out of the lineup override.
    const admin = await requireLeagueAdmin(user.id, leagueId)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    // Get all managers in the league (those with squads)
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select(`
        manager_id,
        users!inner (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('league_id', leagueId)

    if (!squads) {
      return NextResponse.json({ managers: [] })
    }

    // Type assertion for Supabase joined data
    // Note: !inner join returns a single object, not an array
    type SquadWithUser = {
      manager_id: string;
      users: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
    };

    const managers = (squads as unknown as SquadWithUser[]).map(squad => ({
      id: squad.users.id,
      firstName: squad.users.first_name,
      lastName: squad.users.last_name,
      email: squad.users.email
    }))

    // If gameweekId is provided, get lineups for that gameweek
    if (gameweekId) {
      const { data: lineups } = await supabaseAdmin
        .from('lineups')
        .select('*')
        .eq('gameweek_id', gameweekId)

      return NextResponse.json({ managers, lineups: lineups || [] })
    }

    return NextResponse.json({ managers })
  } catch (error) {
    console.error('Error fetching lineups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
