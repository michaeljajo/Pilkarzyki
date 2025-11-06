import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateRoundRobinSchedule } from '@/utils/scheduling'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    console.log('POST schedule - userId:', userId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params
    console.log('POST schedule - leagueId:', leagueId)

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Verify league exists and user has admin access
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('admin_id, name')
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

    // Get all managers for this league
    console.log('Fetching managers for leagueId (using squads table):', leagueId)
    const { data: managers, error: managersError } = await supabaseAdmin
      .from('squads')
      .select('manager_id')
      .eq('league_id', leagueId)

    console.log('Managers query result:', { managers, managersError })

    if (managersError) {
      console.error('Managers query error:', managersError)
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    if (!managers || managers.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 managers to generate schedule' },
        { status: 400 }
      )
    }

    // Extract manager IDs
    const managerIds = managers.map(m => m.manager_id)
    console.log('Manager IDs:', managerIds)

    // Calculate total gameweeks using double round-robin formula: 2 * (n - 1)
    const totalGameweeks = 2 * (managerIds.length - 1)
    console.log('Total gameweeks to create:', totalGameweeks)

    // Check if schedule already exists
    console.log('Checking for existing schedule...')
    const { data: existingGameweeks } = await supabaseAdmin
      .from('gameweeks')
      .select('id')
      .eq('league_id', leagueId)
      .limit(1)

    console.log('Existing gameweeks check:', existingGameweeks)

    if (existingGameweeks && existingGameweeks.length > 0) {
      console.log('Schedule already exists, returning error')
      return NextResponse.json(
        { error: 'Schedule already exists. Delete existing schedule first.' },
        { status: 400 }
      )
    }

    // Generate round-robin schedule
    console.log('Generating round-robin schedule...')
    const scheduleMatches = generateRoundRobinSchedule(managerIds)
    console.log('Generated schedule matches:', scheduleMatches.length)
    console.log('Schedule matches detail:', scheduleMatches)

    // Create simplified gameweeks (just week numbers)
    // Add start_date, end_date, and lock_date as required by database schema
    const gameweeksToInsert = Array.from({ length: totalGameweeks }, (_, i) => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + (i * 7)) // Weekly intervals
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6) // End 6 days later
      const lockDate = new Date(startDate)
      lockDate.setDate(lockDate.getDate() + 5) // Lock 1 day before end date

      return {
        league_id: leagueId,
        week: i + 1,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        lock_date: lockDate.toISOString(),
        is_completed: false
      }
    })

    console.log('Creating gameweeks with dates:', { totalGameweeks, gameweeksToInsert })

    // Insert gameweeks
    const { data: insertedGameweeks, error: gameweeksError } = await supabaseAdmin
      .from('gameweeks')
      .insert(gameweeksToInsert)
      .select('id, week')

    console.log('Gameweeks creation result:', { insertedGameweeks, gameweeksError })

    if (gameweeksError) {
      return NextResponse.json({ error: 'Failed to create gameweeks' }, { status: 500 })
    }

    try {
      // Create mapping of week number to gameweek ID
      const gameweekMap = insertedGameweeks.reduce((acc, gw) => {
        acc[gw.week] = gw.id
        return acc
      }, {} as Record<number, string>)

      console.log('Gameweek mapping:', gameweekMap)

      // Prepare match data for insertion
      const matchesToInsert = scheduleMatches.map(match => ({
        league_id: leagueId,
        gameweek_id: gameweekMap[match.gameweek],
        home_manager_id: match.homeManagerId,
        away_manager_id: match.awayManagerId,
        home_score: null,
        away_score: null,
        is_completed: false
      }))

      console.log('Matches to insert:', matchesToInsert)

      // Insert matches
      const { data: insertedMatches, error: matchesError } = await supabaseAdmin
        .from('matches')
        .insert(matchesToInsert)
        .select()

      console.log('Matches creation result:', { insertedMatches, matchesError })

      if (matchesError) {
        console.error('Match creation error details:', matchesError)
        // Rollback: delete the created gameweeks
        await supabaseAdmin
          .from('gameweeks')
          .delete()
          .eq('league_id', leagueId)

        return NextResponse.json({ error: 'Failed to create matches', details: matchesError }, { status: 500 })
      }

      // Add a small delay to ensure database consistency before returning
      await new Promise(resolve => setTimeout(resolve, 100))

      return NextResponse.json({
        message: 'League schedule generated successfully',
        stats: {
          totalGameweeks,
          totalMatches: insertedMatches.length,
          managersCount: managerIds.length,
          leagueName: league.name
        }
      })
    } catch (error) {
      console.error('Unexpected error in matches creation:', error)
      // Rollback: delete the created gameweeks
      await supabaseAdmin
        .from('gameweeks')
        .delete()
        .eq('league_id', leagueId)

      return NextResponse.json({
        error: 'Unexpected error creating matches',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error generating league schedule:', error)
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
      .select('admin_id, name')
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

    // Delete all matches for this league (cascading will handle references)
    const { error: matchesError } = await supabaseAdmin
      .from('matches')
      .delete()
      .eq('league_id', leagueId)

    if (matchesError) {
      return NextResponse.json({ error: 'Failed to delete matches' }, { status: 500 })
    }

    // Delete all gameweeks for this league
    const { error: gameweeksError } = await supabaseAdmin
      .from('gameweeks')
      .delete()
      .eq('league_id', leagueId)

    if (gameweeksError) {
      return NextResponse.json({ error: 'Failed to delete gameweeks' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'League schedule deleted successfully',
      leagueName: league.name
    })
  } catch (error) {
    console.error('Error deleting league schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    console.log('GET schedule endpoint called for leagueId:', leagueId)

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // First get gameweeks and matches without user joins
    const { data: gameweeks, error: gameweeksError } = await supabaseAdmin
      .from('gameweeks')
      .select(`
        id,
        week,
        is_completed,
        matches (
          id,
          home_manager_id,
          away_manager_id,
          home_score,
          away_score,
          is_completed
        )
      `)
      .eq('league_id', leagueId)
      .order('week', { ascending: true })

    console.log('GET gameweeks query result:', {
      gameweeks: gameweeks ? gameweeks.length : 'null',
      totalMatches: gameweeks ? gameweeks.reduce((sum, gw) => sum + (gw.matches?.length || 0), 0) : 0,
      gameweeksError,
      fullGameweeksData: gameweeks
    })

    if (gameweeksError) {
      console.error('Gameweeks GET error:', gameweeksError)
      return NextResponse.json({ error: gameweeksError.message }, { status: 500 })
    }

    // Get all unique manager IDs from matches
    const managerIds = new Set()
    gameweeks?.forEach(gw => {
      gw.matches?.forEach(match => {
        managerIds.add(match.home_manager_id)
        managerIds.add(match.away_manager_id)
      })
    })

    console.log('Manager IDs extracted from matches:', Array.from(managerIds))

    // Fetch user data for all managers
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', Array.from(managerIds))

    console.log('GET users query result:', {
      users: users ? users.length : 'null',
      usersError,
      fullUsersData: users
    })

    if (usersError) {
      console.error('Users GET error:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Fetch squad team names for this league
    const { data: squads, error: squadsError } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', Array.from(managerIds))

    if (squadsError) {
      console.error('Squads GET error:', squadsError)
      return NextResponse.json({ error: squadsError.message }, { status: 500 })
    }

    // Create squad lookup map
    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // Create user lookup map with squad data
    type UserData = { id: string; first_name: string | null; last_name: string | null; email: string; squad?: { team_name?: string } }
    const userMap: Record<string, UserData> = {}
    users?.forEach((user) => {
      userMap[user.id] = {
        ...user,
        squad: squadMap.get(user.id)
      }
    })

    // Merge user data into schedule
    const schedule = gameweeks?.map(gameweek => ({
      ...gameweek,
      matches: gameweek.matches?.map(match => ({
        ...match,
        home_manager: userMap[match.home_manager_id],
        away_manager: userMap[match.away_manager_id]
      }))
    }))

    console.log('Final schedule with user data:', {
      schedule: schedule ? schedule.length : 'null',
      totalGameweeks: schedule?.length,
      totalMatches: schedule?.reduce((sum, gw) => sum + (gw.matches?.length || 0), 0),
      firstGameweekSample: schedule && schedule.length > 0 ? {
        id: schedule[0].id,
        week: schedule[0].week,
        matchesCount: schedule[0].matches?.length,
        firstMatchSample: schedule[0].matches && schedule[0].matches.length > 0 ? {
          id: schedule[0].matches[0].id,
          home_manager: schedule[0].matches[0].home_manager,
          away_manager: schedule[0].matches[0].away_manager
        } : 'no matches'
      } : 'no gameweeks'
    })
    console.log('Schedule compilation timestamp:', new Date().toISOString())

    return NextResponse.json({
      schedule: schedule || [],
      hasSchedule: schedule && schedule.length > 0
    })
  } catch (error) {
    console.error('Error fetching league schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}