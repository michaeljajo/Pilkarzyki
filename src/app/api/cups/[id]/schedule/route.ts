import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import {
  generateGroupStageSchedule,
  GroupAssignment,
  CupScheduleMatch
} from '@/utils/cup-scheduling'

interface GameweekMapping {
  cupWeek: number
  leagueGameweekId: string
}

/**
 * GET /api/cups/[id]/schedule
 * Fetch complete cup schedule with gameweeks and matches
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params

    // Fetch all cup gameweeks with matches
    const { data: cupGameweeks, error: gameweeksError } = await supabaseAdmin
      .from('cup_gameweeks')
      .select(`
        *,
        gameweeks (
          id,
          week,
          start_date,
          end_date,
          lock_date,
          is_completed
        ),
        cup_matches (
          id,
          cup_gameweek_id,
          home_manager_id,
          away_manager_id,
          home_team_source,
          away_team_source,
          stage,
          leg,
          match_number,
          group_name,
          home_score,
          away_score,
          home_aggregate_score,
          away_aggregate_score,
          is_completed,
          winner_id
        )
      `)
      .eq('cup_id', cupId)
      .order('cup_week', { ascending: true })

    if (gameweeksError) {
      return NextResponse.json({ error: gameweeksError.message }, { status: 500 })
    }

    // Get all unique manager IDs from matches
    interface CupMatchDb {
      home_manager_id: string | null
      away_manager_id: string | null
      home_team_source?: string
      away_team_source?: string
      id: string
      cup_id: string
      cup_gameweek_id: string
      stage: string
      leg: number
      match_number?: number
      group_name: string | null
      home_score: number | null
      away_score: number | null
      home_aggregate_score: number | null
      away_aggregate_score: number | null
      is_completed: boolean
      winner_id: string | null
      created_at: string
      updated_at: string
    }

    interface UserData {
      id: string
      first_name?: string
      last_name?: string
      email: string
    }

    const managerIds = new Set<string>()
    cupGameweeks?.forEach(gw => {
      gw.cup_matches?.forEach((match: CupMatchDb) => {
        // Only add non-null manager IDs (skip placeholders)
        if (match.home_manager_id) managerIds.add(match.home_manager_id)
        if (match.away_manager_id) managerIds.add(match.away_manager_id)
      })
    })

    // Get cup details to fetch league_id
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('league_id')
      .eq('id', cupId)
      .single()

    // Fetch user data for all managers
    const { data: users, error: usersError} = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', Array.from(managerIds))

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Fetch squad team names for this league
    const { data: squads } = cup ? await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', cup.league_id)
      .in('manager_id', Array.from(managerIds)) : { data: null }

    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // Create user lookup map with squad data
    const userMap: Record<string, UserData & { squad?: { team_name?: string } }> = {}
    users?.forEach(user => {
      userMap[user.id] = {
        ...user,
        squad: squadMap.get(user.id)
      }
    })

    // Merge user data into schedule
    const schedule = cupGameweeks?.map(gameweek => ({
      ...gameweek,
      matches: gameweek.cup_matches?.map((match: CupMatchDb) => ({
        ...match,
        home_manager: match.home_manager_id ? userMap[match.home_manager_id] : null,
        away_manager: match.away_manager_id ? userMap[match.away_manager_id] : null
      }))
    }))

    return NextResponse.json({ schedule: schedule || [] })
  } catch (error) {
    console.error('Error fetching cup schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/cups/[id]/schedule
 * Generate cup schedule (group stage)
 * Body: { gameweekMappings: [{ cupWeek: number, leagueGameweekId: string }] }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params
    const { gameweekMappings } = await request.json()

    if (!gameweekMappings || !Array.isArray(gameweekMappings)) {
      return NextResponse.json({ error: 'gameweekMappings array is required' }, { status: 400 })
    }

    // Get cup and verify admin access
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('league_id, stage')
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, cup.league_id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Check if schedule already exists
    const { data: existingGameweeks } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id')
      .eq('cup_id', cupId)
      .limit(1)

    if (existingGameweeks && existingGameweeks.length > 0) {
      return NextResponse.json(
        { error: 'Cup schedule already exists. Delete existing schedule first.' },
        { status: 400 }
      )
    }

    // Get group assignments
    const { data: groupData, error: groupError } = await supabaseAdmin
      .from('cup_groups')
      .select('group_name, manager_id')
      .eq('cup_id', cupId)
      .order('group_name')

    if (groupError) {
      return NextResponse.json({ error: 'Failed to fetch group assignments' }, { status: 500 })
    }

    if (!groupData || groupData.length === 0) {
      return NextResponse.json(
        { error: 'No group assignments found. Please assign managers to groups first.' },
        { status: 400 }
      )
    }

    // Transform group data into GroupAssignment format
    const groupMap: Record<string, string[]> = {}
    groupData.forEach(assignment => {
      if (!groupMap[assignment.group_name]) {
        groupMap[assignment.group_name] = []
      }
      groupMap[assignment.group_name].push(assignment.manager_id)
    })

    const groupAssignments: GroupAssignment[] = Object.entries(groupMap).map(([name, ids]) => ({
      groupName: name,
      managerIds: ids
    }))

    // Generate group stage schedule
    const scheduleMatches = generateGroupStageSchedule(groupAssignments)

    // Find max cup week from generated schedule
    const maxCupWeek = Math.max(...scheduleMatches.map(m => m.cupWeek))

    // Validate we have enough gameweek mappings
    if (gameweekMappings.length < maxCupWeek) {
      return NextResponse.json(
        { error: `Schedule requires ${maxCupWeek} gameweeks but only ${gameweekMappings.length} mappings provided` },
        { status: 400 }
      )
    }

    // Determine total managers for knockout structure
    const totalManagers = groupAssignments.reduce((sum, g) => sum + g.managerIds.length, 0)

    // Create cup gameweeks for ALL stages (group + knockout)
    const cupGameweeksToInsert = gameweekMappings.map((mapping: GameweekMapping, index: number) => {
      let stage = 'group_stage'
      let leg = 1

      if (totalManagers === 4) {
        // 4-team cup: weeks 1-2 group, 3-4 semi, 5 final
        if (mapping.cupWeek <= 2) {
          stage = 'group_stage'
        } else if (mapping.cupWeek <= 4) {
          stage = 'semi_final'
          leg = mapping.cupWeek - 2
        } else {
          stage = 'final'
        }
      }
      // Add logic for 8, 16, 32 teams later

      return {
        cup_id: cupId,
        league_gameweek_id: mapping.leagueGameweekId,
        cup_week: mapping.cupWeek,
        stage,
        leg
      }
    })

    const { data: insertedGameweeks, error: gameweeksInsertError } = await supabaseAdmin
      .from('cup_gameweeks')
      .insert(cupGameweeksToInsert)
      .select('id, cup_week')

    if (gameweeksInsertError) {
      return NextResponse.json({ error: gameweeksInsertError.message }, { status: 500 })
    }

    // Create mapping of cup_week to cup_gameweek_id
    const cupGameweekMap: Record<number, string> = {}
    insertedGameweeks.forEach(gw => {
      cupGameweekMap[gw.cup_week] = gw.id
    })

    // Insert group stage cup matches
    const cupMatchesToInsert = scheduleMatches.map((match: CupScheduleMatch) => ({
      cup_id: cupId,
      cup_gameweek_id: cupGameweekMap[match.cupWeek],
      home_manager_id: match.homeManagerId,
      away_manager_id: match.awayManagerId,
      stage: match.stage,
      leg: match.leg,
      group_name: match.groupName,
      is_completed: false
    }))

    // NOTE: Knockout matches will be created automatically when group stage completes
    // The knockout gameweeks are created above, but matches are generated later

    const { data: insertedMatches, error: matchesInsertError } = await supabaseAdmin
      .from('cup_matches')
      .insert(cupMatchesToInsert)
      .select()

    if (matchesInsertError) {
      // Rollback: delete created gameweeks
      await supabaseAdmin
        .from('cup_gameweeks')
        .delete()
        .eq('cup_id', cupId)

      return NextResponse.json({ error: matchesInsertError.message }, { status: 500 })
    }

    // Initialize group standings
    const standingsToInsert = groupAssignments.flatMap(group =>
      group.managerIds.map(managerId => ({
        cup_id: cupId,
        group_name: group.groupName,
        manager_id: managerId,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        position: 0,
        qualified: false
      }))
    )

    await supabaseAdmin
      .from('cup_group_standings')
      .insert(standingsToInsert)

    return NextResponse.json({
      message: 'Cup schedule generated successfully',
      stats: {
        totalGameweeks: insertedGameweeks.length,
        totalMatches: insertedMatches.length,
        groups: groupAssignments.length
      }
    })
  } catch (error) {
    console.error('Error generating cup schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/cups/[id]/schedule
 * Delete entire cup schedule
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params

    // Get cup and verify admin access
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('league_id')
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, cup.league_id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Delete cup matches (will cascade from gameweeks, but explicit for clarity)
    await supabaseAdmin
      .from('cup_matches')
      .delete()
      .eq('cup_id', cupId)

    // Delete cup gameweeks
    await supabaseAdmin
      .from('cup_gameweeks')
      .delete()
      .eq('cup_id', cupId)

    // Delete cup group standings
    await supabaseAdmin
      .from('cup_group_standings')
      .delete()
      .eq('cup_id', cupId)

    return NextResponse.json({ message: 'Cup schedule deleted successfully' })
  } catch (error) {
    console.error('Error deleting cup schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
