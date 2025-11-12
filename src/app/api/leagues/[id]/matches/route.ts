import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateRoundRobinSchedule, validateSchedule } from '@/utils/scheduling'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const { data: matches, error } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        gameweek:gameweeks(*),
        home_manager:users!matches_home_manager_id_fkey(id, first_name, last_name, email),
        away_manager:users!matches_away_manager_id_fkey(id, first_name, last_name, email)
      `)
      .eq('league_id', leagueId)
      .order('gameweek_id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique manager IDs from matches
    const managerIds = new Set<string>()
    matches?.forEach(match => {
      if (match.home_manager_id) managerIds.add(match.home_manager_id)
      if (match.away_manager_id) managerIds.add(match.away_manager_id)
    })

    // Fetch squad team names for this league
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', Array.from(managerIds))

    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // Add squad data to manager objects
    const matchesWithSquads = matches?.map(match => ({
      ...match,
      home_manager: match.home_manager ? {
        ...match.home_manager,
        squad: squadMap.get(match.home_manager.id)
      } : null,
      away_manager: match.away_manager ? {
        ...match.away_manager,
        squad: squadMap.get(match.away_manager.id)
      } : null
    }))

    return NextResponse.json({ matches: matchesWithSquads })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const { managerIds, gameweekIds } = await request.json()

    if (!managerIds || !Array.isArray(managerIds) || managerIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 manager IDs required' },
        { status: 400 }
      )
    }

    if (!gameweekIds || !Array.isArray(gameweekIds)) {
      return NextResponse.json(
        { error: 'Gameweek IDs array required' },
        { status: 400 }
      )
    }

    // Verify league exists and user has admin access
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if user is admin of this league
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user || (!user.is_admin && league.admin_id !== user.id)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

// Generate match schedule
    const scheduleMatches = generateRoundRobinSchedule(managerIds)
    const totalGameweeks = scheduleMatches.length > 0 ? Math.max(...scheduleMatches.map(m => m.gameweek)) : 0

    // Validate schedule
    const validation = validateSchedule(scheduleMatches, managerIds, gameweekIds.length)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Schedule validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Verify we have enough gameweeks
    if (totalGameweeks > gameweekIds.length) {
      return NextResponse.json(
        { error: `Not enough gameweeks. Need ${totalGameweeks}, have ${gameweekIds.length}` },
        { status: 400 }
      )
    }

    // Prepare match data for insertion
    const matchesToInsert = scheduleMatches.map(match => ({
      league_id: leagueId,
      gameweek_id: gameweekIds[match.gameweek - 1], // Convert 1-based to 0-based index
      home_manager_id: match.homeManagerId,
      away_manager_id: match.awayManagerId,
      home_score: null,
      away_score: null,
      is_completed: false
    }))

    // Insert matches in batch
    const { data: insertedMatches, error: insertError } = await supabaseAdmin
      .from('matches')
      .insert(matchesToInsert)
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Match schedule created successfully',
      matches: insertedMatches,
      stats: {
        totalMatches: insertedMatches.length,
        totalGameweeks,
        managersCount: managerIds.length
      }
    })
  } catch (error) {
    console.error('Error creating match schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Verify league exists and user has admin access
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if user is admin of this league
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user || (!user.is_admin && league.admin_id !== user.id)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete all matches for this league
    const { error: deleteError } = await supabaseAdmin
      .from('matches')
      .delete()
      .eq('league_id', leagueId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'All matches deleted successfully' })
  } catch (error) {
    console.error('Error deleting matches:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}