import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Get admin's internal user ID
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Verify user is admin of this league
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', leagueId)
      .single()

    if (!league || league.admin_id !== adminUser.id) {
      return NextResponse.json({ error: 'Unauthorized - not league admin' }, { status: 403 })
    }

    // Validate player count (max 3 players)
    if (playerIds.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 players allowed in lineup' }, { status: 400 })
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
          created_by_admin: true,
          admin_creator_id: adminUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLineup.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating lineup:', error)
        return NextResponse.json({ error: 'Failed to update lineup' }, { status: 500 })
      }

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
          created_by_admin: true,
          admin_creator_id: adminUser.id,
          is_locked: false,
          total_goals: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lineup:', error)
        return NextResponse.json({ error: 'Failed to create lineup' }, { status: 500 })
      }

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

    // Get admin's internal user ID
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Verify user is admin of this league
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', leagueId)
      .single()

    if (!league || league.admin_id !== adminUser.id) {
      return NextResponse.json({ error: 'Unauthorized - not league admin' }, { status: 403 })
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
    // Note: !inner join returns users as array with single element
    type SquadWithUser = {
      manager_id: string;
      users: Array<{
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      }>;
    };

    const managers = (squads as SquadWithUser[]).map(squad => ({
      id: squad.users[0].id,
      firstName: squad.users[0].first_name,
      lastName: squad.users[0].last_name,
      email: squad.users[0].email
    }))

    // If gameweekId is provided, get lineups for that gameweek
    if (gameweekId) {
      const { data: lineups } = await supabaseAdmin
        .from('lineups')
        .select('*')
        .eq('gameweek_id', gameweekId)
        .in('manager_id', managers.map(m => m.id))

      return NextResponse.json({ managers, lineups: lineups || [] })
    }

    return NextResponse.json({ managers })
  } catch (error) {
    console.error('Error fetching lineups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
