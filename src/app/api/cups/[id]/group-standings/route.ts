import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/cups/[id]/group-standings
 * Fetch cup group standings with manager details
 * Returns standings grouped by group name
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

    // Get cup details
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select(`
        id,
        name,
        stage,
        league_id,
        leagues:league_id (
          id,
          name,
          season
        )
      `)
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a member of this league (has a squad)
    const { data: userSquad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', cup.league_id)
      .eq('manager_id', userRecord.id)
      .single()

    if (!userSquad) {
      return NextResponse.json({ error: 'Access denied. You are not a member of this league.' }, { status: 403 })
    }

    // Fetch all group standings for this cup
    const { data: standings, error: standingsError } = await supabaseAdmin
      .from('cup_group_standings')
      .select(`
        id,
        group_name,
        manager_id,
        played,
        won,
        drawn,
        lost,
        goals_for,
        goals_against,
        goal_difference,
        points,
        position,
        qualified,
        updated_at
      `)
      .eq('cup_id', cupId)
      .order('group_name', { ascending: true })
      .order('position', { ascending: true })

    if (standingsError) {
      return NextResponse.json({ error: standingsError.message }, { status: 500 })
    }

    if (!standings || standings.length === 0) {
      return NextResponse.json({
        cup,
        groups: []
      })
    }

    // Fetch user data for all managers
    const managerIds = standings.map(s => s.manager_id)
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', managerIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    // Add manager details to standings
    const standingsWithManagers = standings.map(standing => ({
      ...standing,
      manager: userMap.get(standing.manager_id)
    }))

    // Group standings by group name
    const groupedStandings = standingsWithManagers.reduce((acc, standing) => {
      if (!acc[standing.group_name]) {
        acc[standing.group_name] = []
      }
      acc[standing.group_name].push(standing)
      return acc
    }, {} as Record<string, typeof standingsWithManagers>)

    // Convert to array format for easier frontend consumption
    const groups = Object.entries(groupedStandings).map(([groupName, standings]) => ({
      group_name: groupName,
      standings
    }))

    return NextResponse.json({
      cup,
      groups
    })
  } catch (error) {
    console.error('Error fetching cup group standings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
