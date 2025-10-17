import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { validateLineup } from '@/utils/validation'

/**
 * GET /api/cup-lineups?cupGameweekId=xxx
 * Fetch cup lineup for current manager and cup gameweek
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cupGameweekId = searchParams.get('cupGameweekId')

    if (!cupGameweekId) {
      return NextResponse.json({ error: 'cupGameweekId is required' }, { status: 400 })
    }

    // Get user record
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      // Create user if doesn't exist (same pattern as league lineups)
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
          .select('id')
          .single()

        if (insertError) {
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        userRecord = newUser
      } catch (clerkError) {
        return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
      }
    }

    // Get cup lineup for this manager and cup gameweek
    const { data: cupLineup, error } = await supabaseAdmin
      .from('cup_lineups')
      .select(`
        *,
        cup_gameweeks (
          *,
          gameweeks (
            id,
            week,
            start_date,
            end_date,
            lock_date,
            is_completed
          )
        )
      `)
      .eq('manager_id', userRecord.id)
      .eq('cup_gameweek_id', cupGameweekId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cupLineup: cupLineup || null })
  } catch (error) {
    console.error('Error fetching cup lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/cup-lineups
 * Create or update cup lineup
 * Body: { cupGameweekId: string, playerIds: string[] }
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

    // Get user record
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      // Create user if doesn't exist
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
          .select('id')
          .single()

        if (insertError) {
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        userRecord = newUser
      } catch (clerkError) {
        return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
      }
    }

    // Check if cup gameweek is locked via league gameweek
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

    const lockDate = cupGameweek.gameweeks?.lock_date
    if (lockDate && new Date() > new Date(lockDate)) {
      return NextResponse.json({ error: 'Cannot modify lineup after lock date' }, { status: 400 })
    }

    // Validate lineup if playerIds provided
    if (playerIds.length > 0) {
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('*')
        .in('id', playerIds)

      if (players) {
        const validation = validateLineup(players)
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
        }
      }
    }

    // Create or update cup lineup
    const { data: cupLineup, error } = await supabaseAdmin
      .from('cup_lineups')
      .upsert({
        manager_id: userRecord.id,
        cup_gameweek_id: cupGameweekId,
        player_ids: playerIds,
        is_locked: false,
        total_goals: 0
      }, {
        onConflict: 'manager_id,cup_gameweek_id'
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cupLineup })
  } catch (error) {
    console.error('Error creating/updating cup lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
