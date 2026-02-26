import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'

/**
 * POST /api/cup-penalty-lineups
 * Create or update penalty lineup for a knockout decider cup gameweek.
 * Body: { cupGameweekId: string, playerIds: string[] }
 *
 * Validation:
 * - Max 5 players, no duplicates
 * - Goals default to {0,0,0,0,0} (only admin sets actual results)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cupGameweekId, playerIds } = await request.json()

    if (!cupGameweekId || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'cupGameweekId and playerIds array are required' }, { status: 400 })
    }

    // Validate: max 5, no duplicates
    if (playerIds.length > 5) {
      return NextResponse.json({ error: 'Maksymalnie 5 wykonawców rzutów karnych' }, { status: 400 })
    }

    const uniqueIds = new Set(playerIds)
    if (uniqueIds.size !== playerIds.length) {
      return NextResponse.json({ error: 'Zawodnicy nie mogą się powtarzać' }, { status: 400 })
    }

    // Get user record
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const { firstName, lastName } = resolveUserNames({
          email,
          first_name: clerkUser.firstName || undefined,
          last_name: clerkUser.lastName || undefined,
          username: clerkUser.username || undefined
        })

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            is_admin: clerkUser.publicMetadata?.isAdmin === true
          })
          .select('id, email')
          .single()

        if (insertError) {
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        userRecord = newUser
      } catch (clerkError) {
        return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
      }
    }

    // Verify cup gameweek is a knockout decider
    const { data: cupGameweek } = await supabaseAdmin
      .from('cup_gameweeks')
      .select(`
        *,
        gameweeks (
          lock_date
        )
      `)
      .eq('id', cupGameweekId)
      .single()

    if (!cupGameweek) {
      return NextResponse.json({ error: 'Cup gameweek not found' }, { status: 404 })
    }

    const isKnockoutDecider = cupGameweek.stage !== 'group_stage' &&
      (cupGameweek.leg === 2 || cupGameweek.stage === 'final')

    if (!isKnockoutDecider) {
      return NextResponse.json(
        { error: 'Penalty lineups are only allowed for knockout decider gameweeks' },
        { status: 400 }
      )
    }

    // Check lock date
    const lockDate = cupGameweek.gameweeks?.lock_date
    if (lockDate && new Date() > new Date(lockDate)) {
      return NextResponse.json({ error: 'Cannot modify lineup after lock date' }, { status: 400 })
    }

    // Check if manager has a cup match
    const { data: managerCupMatch } = await supabaseAdmin
      .from('cup_matches')
      .select('id')
      .eq('cup_gameweek_id', cupGameweekId)
      .or(`home_manager_id.eq.${userRecord.id},away_manager_id.eq.${userRecord.id}`)
      .limit(1)
      .maybeSingle()

    if (!managerCupMatch) {
      return NextResponse.json(
        { error: 'Nie uczestniczysz w tej kolejce pucharowej' },
        { status: 403 }
      )
    }

    // Upsert penalty lineup (goals default to zeros)
    const { data: penaltyLineup, error } = await supabaseAdmin
      .from('cup_penalty_lineups')
      .upsert({
        manager_id: userRecord.id,
        cup_gameweek_id: cupGameweekId,
        player_ids: playerIds,
        goals: [0, 0, 0, 0, 0]
      }, {
        onConflict: 'manager_id,cup_gameweek_id'
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ penaltyLineup })
  } catch (error) {
    console.error('Error creating/updating penalty lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/cup-penalty-lineups
 * Admin sets penalty results (goals scored/missed per taker).
 * Body: { cupGameweekId: string, managerId: string, goals: number[] }
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { cupGameweekId, managerId, goals } = await request.json()

    if (!cupGameweekId || !managerId || !Array.isArray(goals)) {
      return NextResponse.json({ error: 'cupGameweekId, managerId, and goals array are required' }, { status: 400 })
    }

    // Validate goals: each must be 0 or 1
    if (goals.some((g: number) => g !== 0 && g !== 1)) {
      return NextResponse.json({ error: 'Each goal must be 0 (missed) or 1 (scored)' }, { status: 400 })
    }

    // Update penalty lineup goals
    const { data: penaltyLineup, error } = await supabaseAdmin
      .from('cup_penalty_lineups')
      .update({ goals })
      .eq('manager_id', managerId)
      .eq('cup_gameweek_id', cupGameweekId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!penaltyLineup) {
      return NextResponse.json({ error: 'Penalty lineup not found' }, { status: 404 })
    }

    // Calculate total penalty score and update cup match
    const penaltyScore = goals.reduce((sum: number, g: number) => sum + g, 0)

    // Find the cup match for this manager in this gameweek
    const { data: cupMatch } = await supabaseAdmin
      .from('cup_matches')
      .select('id, home_manager_id, away_manager_id')
      .eq('cup_gameweek_id', cupGameweekId)
      .or(`home_manager_id.eq.${managerId},away_manager_id.eq.${managerId}`)
      .limit(1)
      .maybeSingle()

    if (cupMatch) {
      const isHome = cupMatch.home_manager_id === managerId
      const updateField = isHome ? 'home_penalty_score' : 'away_penalty_score'

      await supabaseAdmin
        .from('cup_matches')
        .update({ [updateField]: penaltyScore })
        .eq('id', cupMatch.id)
    }

    return NextResponse.json({ penaltyLineup })
  } catch (error) {
    console.error('Error updating penalty results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
