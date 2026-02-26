import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { validateLineup } from '@/utils/validation'

/**
 * POST /api/cup-et-lineups
 * Create or update extra time lineup for a knockout decider cup gameweek.
 * Body: { cupGameweekId: string, playerIds: string[] }
 *
 * Validation:
 * - Same rules as cup lineup (1-3 players, unique football leagues, max 2 forwards)
 * - NO overlap with the regular cup lineup for the same gameweek
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

    // Verify cup gameweek exists and is a knockout decider
    const { data: cupGameweek } = await supabaseAdmin
      .from('cup_gameweeks')
      .select(`
        *,
        gameweeks (
          lock_date,
          league_id,
          leagues:league_id (
            name
          )
        ),
        cups (
          league_id,
          leagues:league_id (
            name
          )
        )
      `)
      .eq('id', cupGameweekId)
      .single()

    if (!cupGameweek) {
      return NextResponse.json({ error: 'Cup gameweek not found' }, { status: 404 })
    }

    // Verify it's a knockout decider
    const isKnockoutDecider = cupGameweek.stage !== 'group_stage' &&
      (cupGameweek.leg === 2 || cupGameweek.stage === 'final')

    if (!isKnockoutDecider) {
      return NextResponse.json(
        { error: 'ET lineups are only allowed for knockout decider gameweeks' },
        { status: 400 }
      )
    }

    // Check lock date
    const lockDate = cupGameweek.gameweeks?.lock_date
    if (lockDate && new Date() > new Date(lockDate)) {
      return NextResponse.json({ error: 'Cannot modify lineup after lock date' }, { status: 400 })
    }

    // Check if manager has a cup match in this gameweek
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

    const leagueName = (cupGameweek.cups as any)?.leagues?.name || (cupGameweek.gameweeks as any)?.leagues?.name

    // Validate ET lineup if players provided
    if (playerIds.length > 0) {
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('*')
        .in('id', playerIds)
        .eq('league', leagueName)

      if (players) {
        const validation = validateLineup(players)
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
        }
      }

      // Check no overlap with regular cup lineup
      const { data: cupLineup } = await supabaseAdmin
        .from('cup_lineups')
        .select('player_ids')
        .eq('manager_id', userRecord.id)
        .eq('cup_gameweek_id', cupGameweekId)
        .maybeSingle()

      if (cupLineup?.player_ids) {
        const overlap = playerIds.filter((id: string) => cupLineup.player_ids.includes(id))
        if (overlap.length > 0) {
          return NextResponse.json(
            { error: 'Zawodnicy z dogrywki nie mogą pokrywać się ze składem pucharowym' },
            { status: 400 }
          )
        }
      }
    }

    // Upsert ET lineup
    const { data: etLineup, error } = await supabaseAdmin
      .from('cup_et_lineups')
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

    return NextResponse.json({ etLineup })
  } catch (error) {
    console.error('Error creating/updating ET lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
