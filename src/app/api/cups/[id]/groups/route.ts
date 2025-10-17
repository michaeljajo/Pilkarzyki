import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { validateGroupAssignments, GroupAssignment } from '@/utils/cup-scheduling'

interface GroupMember {
  id: string
  managerId: string
  manager: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

/**
 * GET /api/cups/[id]/groups
 * Fetch group assignments for a cup
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

    // Fetch all group assignments for this cup
    const { data: groupAssignments, error } = await supabaseAdmin
      .from('cup_groups')
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('cup_id', cupId)
      .order('group_name')
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by group name
    const groupedData: Record<string, GroupMember[]> = {}
    groupAssignments?.forEach(assignment => {
      if (!groupedData[assignment.group_name]) {
        groupedData[assignment.group_name] = []
      }
      groupedData[assignment.group_name].push({
        id: assignment.id,
        managerId: assignment.manager_id,
        manager: assignment.users
      })
    })

    return NextResponse.json({ groups: groupedData })
  } catch (error) {
    console.error('Error fetching cup groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/cups/[id]/groups
 * Assign managers to groups
 * Body: { groups: [{ groupName: string, managerIds: string[] }] }
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
    const { groups }: { groups: GroupAssignment[] } = await request.json()

    if (!groups || !Array.isArray(groups)) {
      return NextResponse.json({ error: 'groups array is required' }, { status: 400 })
    }

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

    // Get total manager count for this league
    const { data: managers, error: managersError } = await supabaseAdmin
      .from('squads')
      .select('manager_id')
      .eq('league_id', cup.league_id)

    if (managersError) {
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    const totalManagers = managers?.length || 0

    // Validate group assignments
    const validation = validateGroupAssignments(groups, totalManagers)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid group assignments', errors: validation.errors },
        { status: 400 }
      )
    }

    // Delete existing group assignments
    await supabaseAdmin
      .from('cup_groups')
      .delete()
      .eq('cup_id', cupId)

    // Insert new group assignments
    const assignmentsToInsert = groups.flatMap(group =>
      group.managerIds.map(managerId => ({
        cup_id: cupId,
        group_name: group.groupName,
        manager_id: managerId
      }))
    )

    const { data: insertedAssignments, error: insertError } = await supabaseAdmin
      .from('cup_groups')
      .insert(assignmentsToInsert)
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Group assignments saved successfully',
      count: insertedAssignments.length
    })
  } catch (error) {
    console.error('Error assigning cup groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/cups/[id]/groups
 * Delete all group assignments for a cup
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

    // Delete all group assignments
    const { error: deleteError } = await supabaseAdmin
      .from('cup_groups')
      .delete()
      .eq('cup_id', cupId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Group assignments deleted successfully' })
  } catch (error) {
    console.error('Error deleting cup groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
