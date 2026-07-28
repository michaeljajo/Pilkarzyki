import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin, assertLeagueMutableByCup } from '@/lib/auth-helpers'
import { validateGroupAssignments, GroupAssignment } from '@/utils/cup-scheduling'
import type { CupFormat } from '@/types'

interface GroupMember {
  id: string
  managerId: string
  manager: {
    id: string
    first_name: string | null
    last_name: string | null
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
          clerk_id,
          first_name,
          last_name
        )
      `)
      .eq('cup_id', cupId)
      .order('group_name')
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by group name. Expose the Clerk ID as managerId: the frontend keys
    // managers off the Clerk ID (the /managers endpoint returns it as `id`), so
    // returning the raw UUID here would leave saved groups unmatchable on reload.
    const groupedData: Record<string, GroupMember[]> = {}
    groupAssignments?.forEach(assignment => {
      if (!groupedData[assignment.group_name]) {
        groupedData[assignment.group_name] = []
      }
      groupedData[assignment.group_name].push({
        id: assignment.id,
        managerId: assignment.users?.clerk_id ?? assignment.manager_id,
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

    const mutable = await assertLeagueMutableByCup(cupId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    // Get cup and verify admin access
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('league_id, format')
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

    const format = cup.format as CupFormat

    // The number of participants the assignment must cover: an explicit
    // participant list when one is set, otherwise every manager in the league.
    let totalManagers: number
    if (format.participantIds === 'all') {
      const { data: managers, error: managersError } = await supabaseAdmin
        .from('squads')
        .select('manager_id')
        .eq('league_id', cup.league_id)
      if (managersError) {
        return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
      }
      totalManagers = managers?.length || 0
    } else {
      totalManagers = format.participantIds.length
    }

    // Validate group assignments against the cup format
    const validation = validateGroupAssignments(groups, totalManagers, format)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid group assignments', errors: validation.errors },
        { status: 400 }
      )
    }

    // The frontend sends Clerk IDs (the /managers endpoint returns clerk_id as
    // the manager `id`), but cup_groups.manager_id is a UUID FK to users.id.
    // Resolve Clerk IDs → users.id before inserting.
    const incomingIds = Array.from(new Set(groups.flatMap(group => group.managerIds)))
    const { data: userRows, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .in('clerk_id', incomingIds)

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const clerkToUuid = new Map((userRows || []).map(u => [u.clerk_id, u.id]))
    // Fall back to the raw value for anything not matched by clerk_id (e.g. an
    // ID that is already a UUID), so both identifier forms are tolerated.
    const unresolved = incomingIds.filter(id => !clerkToUuid.has(id))
    if (unresolved.length > 0) {
      const { data: uuidRows } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('id', unresolved)
      const knownUuids = new Set((uuidRows || []).map(u => u.id))
      const stillMissing = unresolved.filter(id => !knownUuids.has(id))
      if (stillMissing.length > 0) {
        return NextResponse.json(
          { error: `Unknown manager(s): ${stillMissing.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const resolveManagerId = (id: string) => clerkToUuid.get(id) ?? id

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
        manager_id: resolveManagerId(managerId)
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

    const mutable = await assertLeagueMutableByCup(cupId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
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
