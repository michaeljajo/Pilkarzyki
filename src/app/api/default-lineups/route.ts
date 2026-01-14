import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { validateLineup } from '@/utils/validation'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')

    if (!leagueId) {
      return NextResponse.json({ error: 'leagueId is required' }, { status: 400 })
    }

    // Get user record
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get default lineup
    const { data: defaultLineup } = await supabaseAdmin
      .from('default_lineups')
      .select('*')
      .eq('manager_id', userRecord.id)
      .eq('league_id', leagueId)
      .single()

    return NextResponse.json({ defaultLineup })
  } catch (error) {
    console.error('Error fetching default lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leagueId, playerIds } = await request.json()

    if (!leagueId || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'leagueId and playerIds array are required' }, { status: 400 })
    }

    // Get user record, create if doesn't exist
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {

      try {
        // Fetch user from Clerk
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)

        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const { firstName, lastName } = resolveUserNames({
          email,
          first_name: clerkUser.firstName || undefined,
          last_name: clerkUser.lastName || undefined,
          username: clerkUser.username || undefined
        })

        // Create user in Supabase
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
          console.error('Error creating user in database:', insertError)
          return NextResponse.json({ error: 'Failed to create user in database' }, { status: 500 })
        }

        userRecord = newUser
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError)

        // Fallback: create user with minimal information
        const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: userId,
            email: fallbackEmail,
            first_name: 'User',
            last_name: '',
            is_admin: false
          })
          .select('id, email')
          .single()

        if (insertError) {
          console.error('Error creating fallback user in database:', insertError)
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        userRecord = newUser
      }
    }

    // Get league name for player validation
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Validate lineup if playerIds provided
    if (playerIds.length > 0) {
      // Get player details for validation
      // CRITICAL: Filter by league to prevent cross-league player confusion
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('*')
        .in('id', playerIds)
        .eq('league', league.name)

      if (players) {
        const validation = validateLineup(players)
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
        }
      }
    }

    // Create or update default lineup
    const { data: defaultLineup, error } = await supabaseAdmin
      .from('default_lineups')
      .upsert({
        manager_id: userRecord.id,
        league_id: leagueId,
        player_ids: playerIds
      }, {
        onConflict: 'manager_id,league_id'
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ defaultLineup })
  } catch (error) {
    console.error('Error creating/updating default lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
